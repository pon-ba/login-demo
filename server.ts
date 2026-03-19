// 引入 express 框架，用來建立後端 API 伺服器
import express from "express";
// 引入 vite 的 createServer 函數，用來在開發環境中整合 Vite 的中介軟體 (Middleware)
import { createServer as createViteServer } from "vite";
// 引入 Node.js 內建的 path 模組，用來處理檔案路徑
import path from "path";

// 定義一個非同步函數來啟動伺服器
async function startServer() {
  // 建立一個 Express 應用程式實例
  const app = express();
  // 設定伺服器監聽的 Port 號 (AI Studio 環境規定必須使用 3000)
  const PORT = 3000;

  // 加入 express.json() 中介軟體，讓 Express 能夠解析 HTTP 請求 body 中的 JSON 格式資料
  app.use(express.json());

  // ==========================================
  // API Routes (在這裡練習撰寫你的 API 端點)
  // ==========================================

  // 1. Email/密碼 登入端點 (處理 POST 請求到 /api/auth/login)
  app.post("/api/auth/login", (req, res) => {
    // 從請求的 body 中取出 email 和 password
    const { email, password } = req.body;
    // 在伺服器終端機印出登入嘗試的 Log
    console.log(`[API] Login attempt for email: ${email}`);
    
    // 使用 setTimeout 模擬資料庫查詢和密碼驗證的網路延遲 (1.5秒)
    setTimeout(() => {
      // 簡單的寫死驗證邏輯：檢查 email 和 password 是否符合預設值
      if (email === "test@example.com" && password === "password") {
        // 驗證成功，回傳 HTTP 200 (預設) 以及 JSON 格式的成功訊息與假資料 (如 token, user)
        res.json({ 
          success: true, 
          message: "Login successful",
          token: "mock-jwt-token-12345",
          user: { id: 1, email }
        });
      } else {
        // 驗證失敗，回傳 HTTP 401 (Unauthorized) 以及 JSON 格式的錯誤訊息
        res.status(401).json({ 
          success: false, 
          message: "Invalid email or password. Try test@example.com / password" 
        });
      }
    }, 1500); // 延遲 1500 毫秒
  });

  // 2. 產生 OAuth 授權網址的端點 (處理 GET 請求到 /api/auth/:provider/url，:provider 是動態參數)
  app.get("/api/auth/:provider/url", (req, res) => {
    // 從請求的 URL 參數中取出 provider (例如 'google', 'apple', 'github')
    const { provider } = req.params;
    // 在伺服器終端機印出 Log
    console.log(`[API] Generating OAuth URL for: ${provider}`);
    
    // 在真實的應用程式中，你會在這裡根據 provider 產生對應的 OAuth 授權網址
    // 例如 Google: https://accounts.google.com/o/oauth2/v2/auth?...
    // 這裡我們只回傳一個模擬的網址
    res.json({ 
      url: `https://mock-oauth-provider.com/authorize?provider=${provider}&client_id=mock_client` 
    });
  });

  // ==========================================
  // Vite 中介軟體與靜態檔案服務 (用來同時提供前端畫面)
  // ==========================================
  
  // 判斷目前的執行環境是否「不是」正式環境 (production)
  if (process.env.NODE_ENV !== "production") {
    // 在開發環境下，建立 Vite 伺服器
    const vite = await createViteServer({
      // 設定以中介軟體模式執行，這樣就可以整合進 Express
      server: { middlewareMode: true },
      // 設定應用程式類型為單頁應用程式 (SPA - Single Page Application)
      appType: "spa",
    });
    // 將 Vite 的中介軟體加入 Express，讓 Vite 處理前端的請求 (如 HMR, 模組編譯)
    app.use(vite.middlewares);
  } else {
    // 在正式環境下 (執行 npm run build 之後)
    // 取得編譯後前端檔案所在的 dist 目錄路徑
    const distPath = path.join(process.cwd(), 'dist');
    // 設定 Express 提供 dist 目錄下的靜態檔案 (如 .js, .css, 圖片等)
    app.use(express.static(distPath));
    // 對於所有未匹配到 API 的 GET 請求 ('*')
    app.get('*', (req, res) => {
      // 都回傳 dist/index.html，讓前端的 Router (例如 Vue Router) 接手處理路由
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 啟動 Express 伺服器，監聽指定的 PORT，並綁定到所有網路介面 ("0.0.0.0")
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/auth/*`);
  });
}

// 執行啟動伺服器的函數
startServer();
