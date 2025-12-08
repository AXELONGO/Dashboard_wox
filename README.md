# ERP Sales Dashboard - Project Documentation

## Implementation Plan - History, Quotes, and Auth

This plan covers three major features requested by the user:
1.  **History Date Range Download**: Filter and download history within a specific date range (max 1 month).
2.  **Quote Format Update**: Replicate the specific visual style and fields from the provided "PROSESU" image.
3.  **Google Authentication**: Secure the dashboard with Google Login and an email allowlist.

### User Review Required

> [!IMPORTANT]
> **Google Auth Setup**: You will need to provide a Google Client ID. I will set up the code, but you must create the project in Google Cloud Console and add the Client ID to your `.env` file.

> [!WARNING]
> **Quote Format Changes**: The new format includes fields like "Ret. ISR" and specific bank details. I will hardcode the bank details from the image for now, but they should eventually be configurable.

### Proposed Changes

#### Feature 1: History Date Range Download

- **[MODIFY] server.js**: Update `GET /api/history` to accept `startDate` and `endDate` query parameters. Implement Notion filter logic.
- **[MODIFY] RightSidebar.tsx**: Add Date Picker inputs, validation, and "Descargar Historial" button. Implement CSV generation.
- **[MODIFY] notionService.ts**: Update `getHistoryFromNotionDatabase` to pass date parameters.

#### Feature 2: Quote Format Update

- **[MODIFY] pdfService.ts**: Rewrite `generateQuotePDF` to match the "PROSESU" design (Header, Table, Footer, Bank Data).
- **[MODIFY] QuotesView.tsx**: Add state/inputs for "Retención ISR" and ensure "Concepto" combines Product Name + Description.

#### Feature 3: Google Authentication

- **[NEW] Login.tsx**: Create a login page component using `@react-oauth/google`.
- **[MODIFY] App.tsx**: Add `user` state, render `<Login />` if not authenticated, wrap in `GoogleOAuthProvider`.
- **[MODIFY] server.js**: Add `POST /api/auth/google` to verify tokens. Check email against `allowed_users.json`.
- **[NEW] allowed_users.json**: JSON file containing the list of allowed email addresses.
- **[MODIFY] package.json**: Add `@react-oauth/google` dependency.
- **[MODIFY] backend/package.json**: Add `google-auth-library` dependency.

---

## Walkthrough - New Features Implementation

I have implemented the three requested features. Here is a summary of the changes and how to verify them.

### 1. History Date Range Download

**Changes:**
- **Backend**: Updated `/api/history` to accept `startDate` and `endDate` parameters and filter Notion queries.
- **Frontend**: Added date pickers and a "Descargar Periodo" button to the `RightSidebar`.
- **Logic**: Validates that the selected range is not greater than 31 days. Generates a CSV file with the filtered history.

**Verification:**
1.  Open the "Historial" sidebar (Right Sidebar).
2.  Select a "Desde" (Start) and "Hasta" (End) date.
3.  Try selecting a range > 31 days -> You should see an alert.
4.  Select a valid range and click "Descargar Periodo".
5.  A CSV file named `historial_YYYY-MM-DD_YYYY-MM-DD.csv` should download.

### 2. Quote Format Update (PROSESU Design)

**Changes:**
- **PDF Generation**: Completely rewrote `generateQuotePDF` in `pdfService.ts`.
- **Design**:
    - **Header**: Black background, "PROSESU SMART LOGISTICS" logo text, Slogan, and simulated icons.
    - **Info Bar**: Gray bar with Pro-forma number and Date.
    - **Customer Info**: Layout matching the image (Contact, Company, Phone, RFC placeholder, Email).
    - **Table**: Columns "Concepto", "Cant.", "Precio Unitario", "Precio total".
    - **Footer**: Subtotal, Descuento (placeholder), IVA (8%), Ret. ISR (1.25%), Total (Pagado).
    - **Bottom**: Seller info and Bank Data (Citibanamex).
- **UI**: Updated `QuotesView.tsx` to calculate and display IVA (8%) and Ret. ISR (1.25%) so the screen matches the PDF.

**Verification:**
1.  Go to the "Cotizaciones" tab.
2.  Add items to a quote.
3.  Observe the totals on screen (IVA 8%, Ret ISR 1.25%).
4.  Click "Generar PDF".
5.  Open the PDF and verify it matches the "PROSESU" image style.

### 3. Google Authentication

**Changes:**
- **Backend**: Added `/api/auth/google` endpoint to verify tokens.
- **Security**: Created `backend/allowed_users.json` to whitelist specific emails.
- **Frontend**: Added `Login.tsx` component with "Sign in with Google" button.
- **App**: Protected the main dashboard; users must log in first.

**Configuration Required:**
> [!IMPORTANT]
> You must set up a Google Cloud Project and get a **Client ID**.
> 1. Go to [Google Cloud Console](https://console.cloud.google.com/).
> 2. Create a project and configure OAuth Consent Screen.
> 3. Create Credentials -> OAuth Client ID (Web Application).
> 4. Add `http://localhost:5173` (or your dev URL) to "Authorized JavaScript origins".
> 5. Add the Client ID to your `.env` file as `VITE_GOOGLE_CLIENT_ID=your-client-id`.
> 6. Add the Client ID to your backend `.env` file as `GOOGLE_CLIENT_ID=your-client-id`.

**Verification:**
1.  Start the app. You should be redirected to the Login screen.
2.  Try logging in with an email NOT in `allowed_users.json` -> Access Denied.
3.  Add your email to `backend/allowed_users.json`.
4.  Try logging in again -> You should see the Dashboard.

### Next Steps
Run the following commands to install the new dependencies:

```bash
npm install @react-oauth/google
cd backend && npm install google-auth-library
```
