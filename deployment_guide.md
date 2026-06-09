# BuildSphere Deployment & Update Guide

Keep this guide handy! Whenever you make changes to your code locally and want to push them live to your website, follow these steps depending on whether you changed the Frontend (Visuals/React) or the Backend (API/Node.js).

---

## 🎨 Updating the Frontend (buildsphere.cityscapebuildersinc.com)

If you made changes to buttons, colors, pages, or anything inside the `website/frontend` folder:

1. **Build the Production Files:**
   - Open your terminal (or command prompt).
   - Navigate to the frontend folder: `cd c:\Users\User\Documents\BuildSphere\website\frontend`
   - Run the build command: `npm run build`
   - *This will generate a new `dist` folder containing your optimized, live-ready code.*

2. **Access Hostinger File Manager:**
   - Log in to your Hostinger hPanel.
   - Go to **Websites** -> Manage `cityscapebuildersinc.com`.
   - On the left sidebar, click **Files** -> **File Manager**.
   - Navigate to `/public_html/buildsphere` (or wherever your `buildsphere` subdomain folder is located).

3. **Replace the Old Files:**
   - Delete the old `assets` folder and `index.html` file in the `buildsphere` folder.
   - On your computer, open `C:\Users\User\Documents\BuildSphere\website\frontend\dist`.
   - Upload **all** the contents of the `dist` folder directly into your Hostinger `buildsphere` folder.

4. **Verify:**
   - Visit `https://buildsphere.cityscapebuildersinc.com` and do a Hard Refresh (`Ctrl + Shift + R`) to see your new changes!

---

## ⚙️ Updating the Backend (api.cityscapebuildersinc.com)

If you made changes to the database logic, routes, controllers, or anything inside the `website/backend` folder:

1. **Create the Deployment Zip:**
   - Open PowerShell as Administrator.
   - Navigate to the backend folder: `cd c:\Users\User\Documents\BuildSphere\website\backend`
   - Run this exact command to zip your code **without** the massive `node_modules` folder:
     ```powershell
     Remove-Item ..\backend.zip -Force; Get-ChildItem -Force -Exclude "node_modules" | Compress-Archive -DestinationPath ..\backend.zip -Force
     ```
   - *This creates a tiny `backend.zip` file in your `website` folder.*

2. **Access Hostinger Node.js Wizard:**
   - Log in to your Hostinger hPanel.
   - Go to **Websites** -> Manage `api.cityscapebuildersinc.com`.
   - On the Node.js Dashboard, click the **Settings and redeploy** button (or **Redeploy**).

3. **Upload and Deploy:**
   - Upload your newly created `backend.zip` file.
   - Double-check that your Environment Variables are still there (you don't usually need to change these unless you added new keys to your `.env` file locally).
   - Click **Deploy**.

4. **Verify:**
   - Wait for the status to change to **Running**.
   - Your frontend will now automatically use the updated backend logic!

> [!TIP]
> **Did you add a new NPM Package?**
> If you installed a new package using `npm install <package-name>` in the backend, Hostinger will automatically detect it in your `package.json` file and install it for you when you redeploy. You don't need to do anything extra!
