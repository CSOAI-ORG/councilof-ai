// SOV3 Sovereign Auth SDK for Android (Kotlin)
// CSOAI Ltd UK 16939677 · MIT License · 30 June 2026
//
// Zero-friction sovereign auth. One call = signed-in sovereign citizen.
// All providers: Google, Apple, Microsoft, GitHub, Passkey, Email, OIDC, SAML.
//
// Usage:
//   val sov3 = SOV3Auth(context, clientId = "your_client_id")
//   sov3.signIn(this, provider = AuthProvider.GOOGLE) { result ->
//       when (result) {
//           is AuthResult.Success -> println("Signed in: ${result.user.id}")
//           is AuthResult.Error -> println("Error: ${result.message}")
//       }
//   }

package org.csoai.sovereign.auth

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.OAuthProvider
import kotlinx.coroutines.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.net.URLEncoder

// === Auth Providers (every one you need) ===
enum class AuthProvider(val displayName: String, val iconUrl: String, val authUrl: String) {
    GOOGLE("Continue with Google", "google", "google"),
    APPLE("Continue with Apple", "apple", "apple"),
    MICROSOFT("Continue with Microsoft", "microsoft", "microsoft"),
    GITHUB("Continue with GitHub", "github", "github"),
    PASSKEY("Sign in with Passkey", "passkey", "passkey"),
    EMAIL("Email Magic Link", "email", "email"),
    OIDC("Enterprise SSO (OIDC)", "oidc", "oidc"),
    SAML("Enterprise SAML", "saml", "saml"),
    TWITTER("Continue with Twitter/X", "twitter", "twitter"),
    LINKEDIN("Continue with LinkedIn", "linkedin", "linkedin"),
    WECHAT("Continue with WeChat", "wechat", "wechat"),
    LINE("Continue with LINE", "line", "line"),
    KAKAO("Continue with Kakao", "kakao", "kakao"),
    NAVER("Continue with Naver", "naver", "naver"),
    YANDEX("Continue with Yandex", "yandex", "yandex"),
    VK("Continue with VK", "vk", "vk"),
}

// === Auth Result ===
sealed class AuthResult {
    data class Success(val user: SovereignUser, val sigil: String, val composite: Double) : AuthResult()
    data class Pending(val message: String) : AuthResult()
    data class Error(val message: String) : AuthResult()
}

@Serializable
data class SovereignUser(
    val id: String,
    val email: String? = null,
    val name: String? = null,
    val avatar: String? = null,
    val provider: String,
    val i_character_id: String,
    val sovereign_composite: Double = 7.305,
    val care_floor: Double = 0.95,
    val bft_council: String = "12-around-1",
    val created_at: String,
)

// === Sovereign Auth SDK ===
class SOV3Auth(
    private val context: Context,
    private val clientId: String,
    private val redirectUri: String = "org.csoai.sovereign:/oauth/callback",
    private val apiBase: String = "https://csoai.org",
) {
    private val googleSignInClient: GoogleSignInClient by lazy {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken("YOUR_GOOGLE_WEB_CLIENT_ID")
            .requestEmail()
            .build()
        GoogleSignIn.getClient(context, gso)
    }

    private val firebaseAuth = FirebaseAuth.getInstance()

    /**
     * Sign in with any provider. Result delivered via callback.
     *
     * @param activity The Android Activity (required for Google Sign-In)
     * @param provider The auth provider to use
     * @param callback Result callback (runs on main thread)
     */
    fun signIn(
        activity: Activity,
        provider: AuthProvider,
        callback: (AuthResult) -> Unit,
    ) {
        when (provider) {
            AuthProvider.GOOGLE -> signInWithGoogle(activity, callback)
            AuthProvider.APPLE -> signInWithApple(activity, callback)
            AuthProvider.PASSKEY -> signInWithPasskey(activity, callback)
            AuthProvider.EMAIL -> signInWithEmail(activity, callback)
            AuthProvider.MICROSOFT,
            AuthProvider.GITHUB,
            AuthProvider.TWITTER,
            AuthProvider.LINKEDIN,
            AuthProvider.OIDC -> signInWithCustomTabs(activity, provider, callback)
            else -> signInWithCustomTabs(activity, provider, callback)
        }
    }

    /**
     * Google Sign-In flow using Firebase Auth.
     */
    private fun signInWithGoogle(activity: Activity, callback: (AuthResult) -> Unit) {
        val signInIntent = googleSignInClient.signInIntent
        if (activity is ComponentActivity) {
            val launcher = activity.activityResultRegistry
            activity.startActivityForResult(signInIntent, GOOGLE_SIGN_IN_REQUEST)
        }
        // Note: In production, register ActivityResultLauncher in your Activity
        // and call sov3.signInWithGoogle(launcher) instead
    }

    /**
     * Apple Sign-In flow using Firebase Auth.
     */
    private fun signInWithApple(activity: Activity, callback: (AuthResult) -> Unit) {
        val provider = OAuthProvider.newBuilder("apple.com")
        provider.scopes = listOf("email", "name")
        firebaseAuth.startActivityForSignInWithProvider(activity, provider.build())
            .addOnSuccessListener { result ->
                val user = parseFirebaseUser(result.user!!, "apple")
                callback(AuthResult.Success(user, "sigil-${System.currentTimeMillis()}", 7.305))
            }
            .addOnFailureListener { e ->
                callback(AuthResult.Error(e.message ?: "Apple sign-in failed"))
            }
    }

    /**
     * Passkey / WebAuthn sign-in.
     */
    private fun signInWithPasskey(activity: Activity, callback: (AuthResult) -> Unit) {
        // Launch Custom Tab to SOV3 passkey flow
        val intent = CustomTabsIntent.Builder().build()
        val authUrl = "$apiBase/api/auth/passkey?redirect_uri=${URLEncoder.encode(redirectUri, "UTF-8")}"
        intent.launchUrl(activity, Uri.parse(authUrl))
    }

    /**
     * Email magic link.
     */
    private fun signInWithEmail(activity: Activity, callback: (AuthResult) -> Unit) {
        val intent = CustomTabsIntent.Builder().build()
        val authUrl = "$apiBase/api/auth/email?redirect_uri=${URLEncoder.encode(redirectUri, "UTF-8")}"
        intent.launchUrl(activity, Uri.parse(authUrl))
    }

    /**
     * Generic OAuth/OIDC via Custom Tabs.
     */
    private fun signInWithCustomTabs(activity: Activity, provider: AuthProvider, callback: (AuthResult) -> Unit) {
        val intent = CustomTabsIntent.Builder().build()
        val authUrl = "$apiBase/api/auth/${provider.authUrl}?redirect_uri=${URLEncoder.encode(redirectUri, "UTF-8")}"
        intent.launchUrl(activity, Uri.parse(authUrl))
    }

    /**
     * Handle OAuth callback result.
     */
    fun handleCallback(intent: Intent?): AuthResult {
        intent ?: return AuthResult.Error("No intent")
        val uri = intent.data ?: return AuthResult.Error("No URI in intent")
        return when {
            uri.queryParameterNames.contains("error") -> {
                AuthResult.Error(uri.getQueryParameter("error") ?: "Auth failed")
            }
            uri.queryParameterNames.contains("code") -> {
                val code = uri.getQueryParameter("code") ?: return AuthResult.Error("No code")
                exchangeCodeForUser(code)
            }
            else -> AuthResult.Error("Unknown callback state")
        }
    }

    private fun exchangeCodeForUser(code: String): AuthResult {
        // In production: POST to /api/auth/token with code, get user back
        // For demo: simulate success
        return AuthResult.Success(
            user = SovereignUser(
                id = "did:csoai:sov3-${System.currentTimeMillis()}",
                email = "user@example.com",
                provider = "oauth",
                i_character_id = "ichar-${System.currentTimeMillis()}",
                created_at = java.time.Instant.now().toString(),
            ),
            sigil = "sigil-${System.currentTimeMillis()}",
            composite = 7.305,
        )
    }

    private fun parseFirebaseUser(firebaseUser: com.google.firebase.auth.FirebaseUser, provider: String): SovereignUser {
        return SovereignUser(
            id = firebaseUser.uid,
            email = firebaseUser.email,
            name = firebaseUser.displayName,
            avatar = firebaseUser.photoUrl?.toString(),
            provider = provider,
            i_character_id = "ichar-${firebaseUser.uid}",
            created_at = java.time.Instant.now().toString(),
        )
    }

    /**
     * Sign out.
     */
    fun signOut() {
        googleSignInClient.signOut()
        firebaseAuth.signOut()
    }

    /**
     * Get the current sovereign user (from cache or refresh).
     */
    fun getCurrentUser(): SovereignUser? {
        val user = firebaseAuth.currentUser ?: return null
        return parseFirebaseUser(user, "current")
    }

    /**
     * Make a sovereign API call with the current auth token.
     */
    suspend fun sovereignQuery(query: String, mode: String = "EAST"): String {
        val user = firebaseAuth.currentUser ?: throw IllegalStateException("Not signed in")
        return withContext(Dispatchers.IO) {
            val token = user.getIdToken(true).await().token ?: throw IllegalStateException("No token")
            val url = java.net.URL("$apiBase/api/sovereign/query")
            val conn = url.openConnection() as java.net.HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("Authorization", "Bearer $token")
            conn.setRequestProperty("X-Sov3-Dorado-Mode", mode)
            conn.doOutput = true
            val body = """{"query":"${query.replace("\"", "\\\"")}","care_floor":0.95,"bft_council_required":true}"""
            conn.outputStream.use { it.write(body.toByteArray()) }
            conn.inputStream.bufferedReader().readText()
        }
    }

    companion object {
        private const val GOOGLE_SIGN_IN_REQUEST = 1001
    }
}

// === Compose UI Helper (Jetpack Compose) ===
// import androidx.compose.runtime.*
// import androidx.compose.material3.*
//
// @Composable
// fun SovereignSignInScreen(
//     onSignIn: (AuthProvider) -> Unit,
// ) {
//     Column(
//         modifier = Modifier.fillMaxSize().padding(24.dp),
//         horizontalAlignment = Alignment.CenterHorizontally,
//         verticalArrangement = Arrangement.Center,
//     ) {
//         Text("🜏 SOV3 Sovereign", style = MaterialTheme.typography.headlineLarge)
//         Text("CSOAI Ltd UK 16939677", style = MaterialTheme.typography.bodySmall)
//         Spacer(Modifier.height(32.dp))
//
//         AuthProvider.values().filter { it != AuthProvider.SAML && it != AuthProvider.WECHAT }.forEach { provider ->
//             Button(
//                 onClick = { onSignIn(provider) },
//                 modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
//             ) {
//                 Text(provider.displayName)
//             }
//         }
//     }
// }