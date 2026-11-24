import { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, Vibration, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebView as WebViewType, WebViewMessageEvent } from 'react-native-webview';

type WebToNative =
  | { type: 'haptic'; style: 'light' | 'medium' | 'success' | 'warning' }
  | { type: 'exit' }
  | { type: 'chrome'; bg: string; dark: boolean };

const HAPTIC_MS = { light: 8, medium: 18, success: 30, warning: 46 } as const;
/** The app ships inside the APK and runs fully offline from its own assets. */
const APP_URI = 'file:///android_asset/www/index.html';
const LOCAL = 'file:///android_asset/';
const BG = '#1f2328';

function send(message: object): string {
  return `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(message))}}));true;`;
}

export default function ToolScreen() {
  const web = useRef<WebViewType>(null);
  // the status bar and nav-bar strips follow the theme the web app reports
  const [chrome, setChrome] = useState({ bg: BG, dark: false });
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const app = AppState.addEventListener('change', (s) => web.current?.injectJavaScript(send({ type: 'native.lifecycle', state: s === 'active' ? 'active' : 'background' })));
    const back = BackHandler.addEventListener('hardwareBackPress', () => { web.current?.injectJavaScript(send({ type: 'native.back' })); return true; });
    return () => { app.remove(); back.remove(); };
  }, []);
  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(event.nativeEvent.data) as WebToNative;
      if (m.type === 'haptic') Vibration.vibrate(HAPTIC_MS[m.style] ?? 12);
      else if (m.type === 'exit') BackHandler.exitApp();
      else if (m.type === 'chrome' && /^#[0-9a-fA-F]{6}$/.test(m.bg)) setChrome({ bg: m.bg, dark: !!m.dark });
    } catch { /* ignore malformed messages */ }
  };
  return (
    <View style={[styles.root, { backgroundColor: chrome.bg, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <StatusBar style={chrome.dark ? 'light' : 'dark'} />
      <WebView ref={web} source={{ uri: APP_URI }} originWhitelist={['file://*']}
        // only the bundled app may load: no remote pages, no new windows
        onShouldStartLoadWithRequest={(r) => r.url.startsWith(LOCAL)} setSupportMultipleWindows={false}
        javaScriptEnabled domStorageEnabled allowFileAccess allowFileAccessFromFileURLs allowingReadAccessToURL={LOCAL}
        mixedContentMode="never" geolocationEnabled={false} webviewDebuggingEnabled={false} textZoom={100}
        overScrollMode="never" bounces={false} androidLayerType="hardware" mediaPlaybackRequiresUserAction={false}
        style={[styles.web, { backgroundColor: chrome.bg }]} onMessage={onMessage} />
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: BG }, web: { flex: 1, backgroundColor: BG } });
