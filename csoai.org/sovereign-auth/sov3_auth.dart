// sov3_auth.dart
// SOV3 Sovereign Auth SDK for Flutter (iOS, Android, Web, Windows, macOS, Linux)
// CSOAI Ltd UK 16939677 · MIT License · 30 June 2026
//
// 17 providers in one SDK. Works in Flutter, Flutter Web, and any
// Flutter-based framework (Flutter for Embedded, etc.).
//
// Usage:
//   import 'package:csoai_org_sov3_auth/sov3_auth.dart';
//
//   final sov3 = SOV3Auth(clientId: 'your_client_id');
//   final user = await sov3.signInWithGoogle();
//   print('Signed in: ${user.iCharacterId}');

library sov3_auth;

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:local_auth/local_auth.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_appauth/flutter_appauth.dart';

// === Constants ===
const String SOV3_API_BASE = 'https://csoai.org';
const String _STORAGE_USER = 'sov3_user';
const String _STORAGE_TOKEN = 'sov3_token';

const FlutterAppAuth _appAuth = FlutterAppAuth();

// === Sovereign User ===
class SovereignUser {
  final String id;
  final String? email;
  final String? name;
  final String? avatar;
  final String provider;
  final String iCharacterId;
  final double sovereignComposite;
  final double careFloor;
  final String bftCouncil;
  final String createdAt;
  final String sigilDigest;
  final String article50Passport;

  SovereignUser({
    required this.id,
    this.email,
    this.name,
    this.avatar,
    required this.provider,
    required this.iCharacterId,
    this.sovereignComposite = 7.305,
    this.careFloor = 0.95,
    this.bftCouncil = '12-around-1',
    required this.createdAt,
    required this.sigilDigest,
    required this.article50Passport,
  });

  factory SovereignUser.fromJson(Map<String, dynamic> json) => SovereignUser(
    id: json['id'] ?? 'unknown',
    email: json['email'],
    name: json['name'],
    avatar: json['avatar'],
    provider: json['provider'] ?? 'unknown',
    iCharacterId: json['i_character_id'] ?? 'ichar-unknown',
    sovereignComposite: (json['sovereign_composite'] as num?)?.toDouble() ?? 7.305,
    careFloor: (json['care_floor'] as num?)?.toDouble() ?? 0.95,
    bftCouncil: json['bft_council'] ?? '12-around-1',
    createdAt: json['created_at'] ?? DateTime.now().toIso8601String(),
    sigilDigest: (json['sigil']?['digest']) ?? 'pending',
    article50Passport: json['article_50_passport'] ?? 'pending',
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'name': name,
    'avatar': avatar,
    'provider': provider,
    'i_character_id': iCharacterId,
    'sovereign_composite': sovereignComposite,
    'care_floor': careFloor,
    'bft_council': bftCouncil,
    'created_at': createdAt,
    'sigil_digest': sigilDigest,
    'article_50_passport': article50Passport,
  };
}

// === Auth Result ===
sealed class SOV3AuthResult {
  const SOV3AuthResult();
}

class SOV3AuthSuccess extends SOV3AuthResult {
  final SovereignUser user;
  final String token;
  const SOV3AuthSuccess(this.user, this.token);
}

class SOV3AuthError extends SOV3AuthResult {
  final String message;
  const SOV3AuthError(this.message);
}

// === SOV3 Auth SDK ===
class SOV3Auth {
  final String clientId;
  final String apiBase;
  final String redirectUri;
  final FlutterSecureStorage _storage;

  SovereignUser? _currentUser;
  String? _currentToken;

  SOV3Auth({
    required this.clientId,
    this.apiBase = SOV3_API_BASE,
    this.redirectUri = 'csoai.sovereign:/oauth/callback',
  }) : _storage = const FlutterSecureStorage() {
    _loadCachedAuth();
  }

  SovereignUser? get currentUser => _currentUser;
  String? get currentToken => _currentToken;
  bool get isSignedIn => _currentUser != null && _currentToken != null;

  // === Load cached auth on init ===
  Future<void> _loadCachedAuth() async {
    try {
      final userJson = await _storage.read(key: _STORAGE_USER);
      final token = await _storage.read(key: _STORAGE_TOKEN);
      if (userJson != null && token != null) {
        _currentUser = SovereignUser.fromJson(jsonDecode(userJson));
        _currentToken = token;
      }
    } catch (e) {
      debugPrint('Failed to load cached auth: $e');
    }
  }

  // === Persist auth ===
  Future<void> _persistAuth(SovereignUser user, String token) async {
    try {
      await _storage.write(key: _STORAGE_USER, value: jsonEncode(user.toJson()));
      await _storage.write(key: _STORAGE_TOKEN, value: token);
      _currentUser = user;
      _currentToken = token;
    } catch (e) {
      debugPrint('Failed to persist auth: $e');
    }
  }

  Future<void> _clearAuth() async {
    try {
      await _storage.delete(key: _STORAGE_USER);
      await _storage.delete(key: _STORAGE_TOKEN);
    } catch (e) {
      debugPrint('Failed to clear auth: $e');
    }
    _currentUser = null;
    _currentToken = null;
  }

  // === Sign in with Apple (iOS/macOS native) ===
  Future<SOV3AuthResult> signInWithApple() async {
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final response = await http.post(
        Uri.parse('$apiBase/api/auth/apple/token'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'identity_token': credential.identityToken,
          'authorization_code': credential.authorizationCode,
          'email': credential.email,
          'full_name': {
            'given': credential.givenName,
            'family': credential.familyName,
          },
        }),
      );

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final user = SovereignUser.fromJson(json);
      final token = json['token'] as String;
      await _persistAuth(user, token);
      return SOV3AuthSuccess(user, token);
    } catch (e) {
      return SOV3AuthError(e.toString());
    }
  }

  // === Sign in with Google ===
  Future<SOV3AuthResult> signInWithGoogle() async {
    try {
      final googleSignIn = GoogleSignIn(
        clientId: clientId,
        scopes: ['email', 'profile'],
      );

      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) return SOV3AuthError('Sign in cancelled');

      final googleAuth = await googleUser.authentication;
      final accessToken = googleAuth.accessToken;

      // Exchange with SOV3 backend
      final response = await http.post(
        Uri.parse('$apiBase/api/auth/google/token'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'access_token': accessToken,
          'id_token': googleAuth.idToken,
          'email': googleUser.email,
          'name': googleUser.displayName,
        }),
      );

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final user = SovereignUser.fromJson(json);
      final token = json['token'] as String;
      await _persistAuth(user, token);
      return SOV3AuthSuccess(user, token);
    } catch (e) {
      return SOV3AuthError(e.toString());
    }
  }

  // === Sign in with Passkey / WebAuthn ===
  Future<SOV3AuthResult> signInWithPasskey() async {
    try {
      // Biometric check first
      final localAuth = LocalAuthentication();
      final canCheck = await localAuth.canCheckBiometrics;
      if (canCheck) {
        final didAuthenticate = await localAuth.authenticate(
          localizedReason: 'Sovereign Sign In',
          options: const AuthenticationOptions(
            biometricOnly: false,
            stickyAuth: true,
          ),
        );
        if (!didAuthenticate) {
          return SOV3AuthError('Biometric authentication failed');
        }
      }
      // Open Custom Tab / Browser
      return signInWithOAuth('passkey');
    } catch (e) {
      return SOV3AuthError(e.toString());
    }
  }

  // === Sign in with Email Magic Link ===
  Future<SOV3AuthResult> signInWithEmail(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$apiBase/api/auth/email'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'client_id': clientId,
          'redirect_uri': redirectUri,
        }),
      );

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return SOV3AuthSuccess(
        SovereignUser(
          id: 'email-pending',
          provider: 'email',
          iCharacterId: 'ichar-email-pending',
          createdAt: DateTime.now().toIso8601String(),
          sigilDigest: 'pending',
          article50Passport: 'pending',
          email: email,
        ),
        '',
      );
    } catch (e) {
      return SOV3AuthError(e.toString());
    }
  }

  // === Sign in with OAuth (generic) ===
  Future<SOV3AuthResult> signInWithOAuth(String provider, {Map<String, String>? config}) async {
    try {
      final authUrl = Uri.parse('$apiBase/api/auth/$provider?client_id=$clientId&redirect_uri=${Uri.encodeComponent(redirectUri)}');

      final result = await _appAuth.authorizeAndExchangeCode(
        AuthorizationTokenRequest(
          '$provider.$clientId',
          redirectUri,
          serviceConfiguration: AuthorizationServiceConfiguration(
            authorizationEndpoint: authUrl,
            tokenEndpoint: Uri.parse('$apiBase/api/auth/$provider/token'),
          ),
          scopes: config?['scopes']?.split(' ') ?? ['openid', 'profile', 'email'],
        ),
      );

      if (result != null && result.accessToken != null) {
        // Fetch user info from SOV3
        final userResp = await http.get(
          Uri.parse('$apiBase/api/auth/me'),
          headers: {'Authorization': 'Bearer ${result.accessToken}'},
        );
        final userJson = jsonDecode(userResp.body) as Map<String, dynamic>;
        final user = SovereignUser.fromJson(userJson);
        await _persistAuth(user, result.accessToken!);
        return SOV3AuthSuccess(user, result.accessToken!);
      }
      return SOV3AuthError('No access token received');
    } catch (e) {
      return SOV3AuthError(e.toString());
    }
  }

  // === Sign Out ===
  Future<void> signOut() async {
    try {
      if (_currentToken != null) {
        await http.post(
          Uri.parse('$apiBase/api/auth/signout'),
          headers: {'Authorization': 'Bearer $_currentToken'},
        );
      }
    } catch (e) {
      debugPrint('Sign out error: $e');
    }
    await _clearAuth();
  }

  // === Make Sovereign API Call ===
  Future<Map<String, dynamic>> sovereignQuery(
    String query, {
    String mode = 'EAST',
    bool bftRequired = true,
  }) async {
    if (_currentToken == null) {
      throw Exception('Not signed in');
    }

    final response = await http.post(
      Uri.parse('$apiBase/api/sovereign/query'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_currentToken',
        'X-Sov3-Dorado-Mode': mode,
      },
      body: jsonEncode({
        'query': query,
        'care_floor': 0.95,
        'bft_council_required': bftRequired,
      }),
    );

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  // === Issue Article 50 Passport ===
  Future<String> article50Passport(String contentHash) async {
    final result = await sovereignQuery('article50:issue', bftRequired: false);
    return result['article_50_passport'] as String;
  }
}

// === Flutter Widgets ===

import 'package:flutter/material.dart';

/// SOV3 Sign-In Button Widget
class SOV3SignInButton extends StatefulWidget {
  final String provider;
  final String? label;
  final SOV3Auth auth;
  final void Function(SovereignUser?)? onSuccess;

  const SOV3SignInButton({
    super.key,
    required this.provider,
    required this.auth,
    this.label,
    this.onSuccess,
  });

  @override
  State<SOV3SignInButton> createState() => _SOV3SignInButtonState();
}

class _SOV3SignInButtonState extends State<SOV3SignInButton> {
  bool _isLoading = false;

  static const _providerLabels = {
    'google': 'Continue with Google',
    'apple': 'Continue with Apple',
    'microsoft': 'Continue with Microsoft',
    'github': 'Continue with GitHub',
    'passkey': 'Sign in with Passkey',
    'email': 'Continue with Email',
    'twitter': 'Continue with Twitter',
    'linkedin': 'Continue with LinkedIn',
    'wechat': 'Continue with WeChat',
    'line': 'Continue with LINE',
    'kakao': 'Continue with Kakao',
    'naver': 'Continue with Naver',
    'yandex': 'Continue with Yandex',
    'vk': 'Continue with VK',
    'oidc': 'Enterprise SSO',
    'saml': 'Enterprise SAML',
  };

  Future<void> _handleSignIn() async {
    setState(() => _isLoading = true);
    try {
      SOV3AuthResult result;
      switch (widget.provider) {
        case 'apple':
          result = await widget.auth.signInWithApple();
          break;
        case 'google':
          result = await widget.auth.signInWithGoogle();
          break;
        case 'passkey':
          result = await widget.auth.signInWithPasskey();
          break;
        case 'email':
          // In production: show email input dialog
          result = await widget.auth.signInWithEmail('user@example.com');
          break;
        default:
          result = await widget.auth.signInWithOAuth(widget.provider);
      }

      if (result is SOV3AuthSuccess) {
        widget.onSuccess?.(result.user);
      } else if (result is SOV3AuthError) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Sign in failed: ${result.message}')),
          );
        }
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isApple = widget.provider == 'apple';
    final displayLabel = widget.label ?? _providerLabels[widget.provider] ?? 'Sign in with ${widget.provider}';

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: Material(
        color: isApple ? Colors.black : const Color(0xFF0A0E27),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(
            color: isApple ? Colors.white : const Color(0xFFFBBF24).withOpacity(0.4),
          ),
        ),
        child: InkWell(
          onTap: _isLoading ? null : _handleSignIn,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (_isLoading)
                  const SizedBox(
                    height: 16,
                    width: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                else
                  Text(
                    displayLabel,
                    style: TextStyle(
                      color: isApple ? Colors.white : const Color(0xFFFBBF24),
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// SOV3 Sign-In Buttons (all providers)
class SOV3SignInButtons extends StatelessWidget {
  final SOV3Auth auth;
  final List<String> providers;
  final void Function(SovereignUser?)? onSuccess;

  const SOV3SignInButtons({
    super.key,
    required this.auth,
    this.providers = const ['google', 'apple', 'passkey', 'email'],
    this.onSuccess,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: providers
          .map((p) => SOV3SignInButton(
                provider: p,
                auth: auth,
                onSuccess: onSuccess,
              ))
          .toList(),
    );
  }
}

/// SOV3 Sovereign Dashboard Widget
class SovereignDashboard extends StatelessWidget {
  final SOV3Auth auth;
  const SovereignDashboard({super.key, required this.auth});

  @override
  Widget build(BuildContext context) {
    final user = auth.currentUser;
    if (user == null) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFBBF24).withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('🜏 Sovereign Citizen',
              style: TextStyle(color: Color(0xFFFBBF24), fontSize: 24, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(user.email ?? user.iCharacterId, style: const TextStyle(color: Colors.white, fontSize: 16)),
          Text('Composite: ${user.sovereignComposite}', style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 12)),
          Text('Care Floor: ${user.careFloor}', style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 12)),
          Text('BFT: ${user.bftCouncil}', style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 12)),
          const SizedBox(height: 16),
          Material(
            color: Colors.red.withOpacity(0.2),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
              side: BorderSide(color: Colors.red.withOpacity(0.4)),
            ),
            child: InkWell(
              onTap: auth.signOut,
              borderRadius: BorderRadius.circular(8),
              child: const Padding(
                padding: EdgeInsets.symmetric(vertical: 10),
                child: Center(child: Text('Sign Out', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600))),
              ),
            ),
          ),
        ],
      ),
    );
  }
}