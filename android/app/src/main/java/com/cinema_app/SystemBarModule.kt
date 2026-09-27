package com.cinema_app

import android.content.pm.ActivityInfo
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SystemBarModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName(): String = "SystemBarModule"

    @ReactMethod
    fun lockLandscape() {
        val activity = reactApplicationContext.currentActivity ?: return
        activity.runOnUiThread {
            activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
        }
    }

    @ReactMethod
    fun unlockOrientation() {
        val activity = reactApplicationContext.currentActivity ?: return
        activity.runOnUiThread {
            activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
    }

    @ReactMethod
    fun hideSystemBars() {
        val activity = reactApplicationContext.currentActivity ?: return
        activity.runOnUiThread {
            val window = activity.window ?: return@runOnUiThread
            val controller = WindowCompat.getInsetsController(window, window.decorView)
            controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            controller.hide(WindowInsetsCompat.Type.systemBars())
        }
    }

    @ReactMethod
    fun showSystemBars() {
        val activity = reactApplicationContext.currentActivity ?: return
        activity.runOnUiThread {
            val window = activity.window ?: return@runOnUiThread
            val controller = WindowCompat.getInsetsController(window, window.decorView)
            controller.show(WindowInsetsCompat.Type.systemBars())
        }
    }
}
