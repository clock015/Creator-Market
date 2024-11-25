import { GlobalContextProvider } from '../context' // 自定义的上下文提供者
import '../styles/globals.css'; // 全局样式

function MyApp({ Component, pageProps }) {
    return (
        <GlobalContextProvider>
            {/* 将所有页面组件包裹在自定义上下文提供者中 */}
            <Component {...pageProps} />
        </GlobalContextProvider>
    );
}

export default MyApp;
