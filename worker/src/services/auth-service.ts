import { nanoid } from 'nanoid';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';
import type { Env } from '../types/index.js';
import type { User } from '@cryptoscam/shared';

const CHALLENGE_TTL_SECONDS = 60;

interface CredentialRow {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string | null;
  created_at: string;
}

interface UserRow {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

function uint8ArrayToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export class AuthService {
  constructor(private readonly env: Env) {}

  async beginRegistration(
    displayName: string,
  ): Promise<{ options: PublicKeyCredentialCreationOptionsJSON; userId: string }> {
    const userId = `usr_${nanoid()}`;

    await this.env.DB.prepare(
      "INSERT INTO users (id, display_name, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))",
    )
      .bind(userId, displayName)
      .run();

    const options = await generateRegistrationOptions({
      rpName: this.env.RP_NAME,
      rpID: this.env.RP_ID,
      userName: displayName,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    await this.env.KV.put(`challenge:${userId}`, options.challenge, {
      expirationTtl: CHALLENGE_TTL_SECONDS,
    });

    return { options, userId };
  }

  async finishRegistration(
    userId: string,
    credential: RegistrationResponseJSON,
  ): Promise<{ user: User }> {
    const expectedChallenge = await this.env.KV.get(`challenge:${userId}`);
    if (!expectedChallenge) {
      throw new AuthError('CHALLENGE_EXPIRED', 'Registration challenge has expired');
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: this.env.RP_ORIGIN,
      expectedRPID: this.env.RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new AuthError('VERIFICATION_FAILED', 'Registration verification failed');
    }

    const { credential: registeredCredential } = verification.registrationInfo;

    const credentialId = registeredCredential.id;
    const publicKeyBase64url = uint8ArrayToBase64url(registeredCredential.publicKey);
    const transports = credential.response.transports
      ? JSON.stringify(credential.response.transports)
      : null;

    const credId = nanoid();
    await this.env.DB.prepare(
      "INSERT INTO credentials (id, user_id, credential_id, public_key, counter, transports, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
    )
      .bind(
        credId,
        userId,
        credentialId,
        publicKeyBase64url,
        registeredCredential.counter,
        transports,
      )
      .run();

    await this.env.KV.delete(`challenge:${userId}`);

    const userRow = await this.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first<UserRow>();

    if (!userRow) {
      throw new AuthError('USER_NOT_FOUND', 'User not found');
    }

    return {
      user: {
        id: userRow.id,
        display_name: userRow.display_name,
        created_at: userRow.created_at,
        updated_at: userRow.updated_at,
      },
    };
  }

  async beginLogin(): Promise<{
    options: PublicKeyCredentialRequestOptionsJSON;
    challengeKey: string;
  }> {
    const challengeKey = `login_${nanoid()}`;

    const options = await generateAuthenticationOptions({
      rpID: this.env.RP_ID,
      userVerification: 'preferred',
    });

    await this.env.KV.put(`challenge:login:${challengeKey}`, options.challenge, {
      expirationTtl: CHALLENGE_TTL_SECONDS,
    });

    return { options, challengeKey };
  }

  async finishLogin(
    credential: AuthenticationResponseJSON,
    challengeKey: string,
  ): Promise<{ user: User }> {
    const expectedChallenge = await this.env.KV.get(`challenge:login:${challengeKey}`);
    if (!expectedChallenge) {
      throw new AuthError('CHALLENGE_EXPIRED', 'Login challenge has expired');
    }

    const credentialIdFromResponse = credential.id;

    const credentialRow = await this.env.DB.prepare(
      'SELECT * FROM credentials WHERE credential_id = ?',
    )
      .bind(credentialIdFromResponse)
      .first<CredentialRow>();

    if (!credentialRow) {
      throw new AuthError('CREDENTIAL_NOT_FOUND', 'Credential not found');
    }

    const publicKeyBytes = base64urlToUint8Array(credentialRow.public_key);
    const storedTransports: AuthenticatorTransportFuture[] | undefined = credentialRow.transports
      ? (JSON.parse(credentialRow.transports) as AuthenticatorTransportFuture[])
      : undefined;

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: this.env.RP_ORIGIN,
      expectedRPID: this.env.RP_ID,
      credential: {
        id: credentialRow.credential_id,
        publicKey: publicKeyBytes,
        counter: credentialRow.counter,
        transports: storedTransports,
      },
    });

    if (!verification.verified) {
      throw new AuthError('VERIFICATION_FAILED', 'Authentication verification failed');
    }

    await this.env.DB.prepare('UPDATE credentials SET counter = ? WHERE id = ?')
      .bind(verification.authenticationInfo.newCounter, credentialRow.id)
      .run();

    await this.env.KV.delete(`challenge:login:${challengeKey}`);

    const userRow = await this.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(credentialRow.user_id)
      .first<UserRow>();

    if (!userRow) {
      throw new AuthError('USER_NOT_FOUND', 'User not found');
    }

    return {
      user: {
        id: userRow.id,
        display_name: userRow.display_name,
        created_at: userRow.created_at,
        updated_at: userRow.updated_at,
      },
    };
  }

  async getUserById(userId: string): Promise<User | null> {
    const userRow = await this.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first<UserRow>();

    if (!userRow) {
      return null;
    }

    return {
      id: userRow.id,
      display_name: userRow.display_name,
      created_at: userRow.created_at,
      updated_at: userRow.updated_at,
    };
  }
}

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export type { RegistrationResponseJSON, AuthenticationResponseJSON };
export type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON };
