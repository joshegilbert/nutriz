# MongoDB Atlas Setup

Follow these steps to provision a free MongoDB Atlas cluster and connect the Nutriz backend.

## 1. Create or sign in to an Atlas account
- Visit [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up (or sign in) with your preferred authentication method.
- When prompted for an organization/project, you can accept the defaults.

## 2. Provision a free shared cluster
- Click **Build a Database** and choose the **Shared** (M0) tier.
- Select your preferred cloud provider and region (choose one geographically close to your users for lower latency).
- Accept the remaining defaults and click **Create Cluster**. Provisioning may take several minutes.

## 3. Configure network access
- Open the **Network Access** tab.
- Click **Add IP Address** and either add your current IP or, for quick testing, use the wide-open rule `0.0.0.0/0` (remember to replace this with a restrictive list before going to production).

## 4. Create a database user
- Open the **Database Access** tab.
- Click **Add New Database User**.
- Choose **Password** authentication, set a username and a strong password, and grant **Atlas admin** or database-specific read/write privileges as needed for the project.
- Save the credentials in a secure password vault—you will need them for the connection string.

## 5. Collect the connection string
- Return to the **Clusters** tab, click **Connect**, then choose **Connect your application**.
- Select the **Node.js** driver and copy the provided `mongodb+srv://` URI.
- Replace `<username>` and `<password>` in the URI with the credentials you created in step 4.
- Optionally append the default database name to the URI path (e.g. `/nutriz`).

## 6. Required environment variables
Review [`nutriz-backend/server.js`](../nutriz-backend/server.js) to confirm the backend expects these variables:

- `MONGO_URI` – the Atlas connection string from step 5.
- `JWT_SECRET` – a strong secret for signing JSON Web Tokens.
- `FRONTEND_URL` – the primary frontend origin (e.g. the production Vercel domain).
- `ALLOWED_ORIGINS` – a comma-separated list of any additional origins that should pass the CORS check.

## 7. Create `.env.production`
Create a file named `.env.production` **locally** (never commit it) with contents similar to:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
JWT_SECRET=<generate-a-strong-secret>
FRONTEND_URL=https://your-frontend-domain.example
ALLOWED_ORIGINS=https://your-frontend-domain.example,http://localhost:5173
```

Keep this file outside of version control (the repository `.gitignore` already ignores `.env.production`). Load these variables in your deployment environment or when starting the backend locally:

```bash
NODE_ENV=production node nutriz-backend/server.js
```

Remember to rotate credentials and secrets periodically and tighten IP access before releasing to production.
