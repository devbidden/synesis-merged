# Admin API

Set a strong `ADMIN_API_KEY` in the server environment before using these endpoints. Sign in to `/admin` on the website with this key; the dashboard exchanges it for an eight-hour session token. Direct API clients may continue to send it in the `x-admin-api-key` header. Admin routes return `503` when the key is not configured, `401` when credentials are missing, and `403` when the API key is incorrect.

All routes are under `/api/admin`:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/login` | Exchange `{ "apiKey": "..." }` for a short-lived admin session token. This login route is rate-limited. |

The website dashboard is available at `/admin`. It provides an overview, paginated license/user/payment views, license creation, and license revocation. The session token is kept in the current browser tab and expires after eight hours.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/licenses` | Create a manual license. JSON body: `{ "name", "email", "duration"?, "plan"? }`. `duration` is an optional number of days; omit it for no expiry. `plan` defaults to `MANUAL`. |
| `GET` | `/licenses` | List licenses. Optional `status`, `page`, and `limit` query parameters. |
| `PATCH` | `/licenses/:id/revoke` | Revoke by Mongo license ID or license key. |
| `GET` | `/users` | List distinct license holders and their licenses. |
| `GET` | `/paying-users` | List distinct customers with at least one successful payment, with payment totals. |
| `GET` | `/payments` | List payment records. Optional `status`, `page`, and `limit` query parameters. |

List endpoints use pages of 50 by default and cap `limit` at 200. For example:

```sh
curl -H "x-admin-api-key: $ADMIN_API_KEY" \
  "https://your-server.example/api/admin/paying-users?page=1&limit=50"
```

The current data model has no standalone user account collection, so `/users` reports people represented by license records. `/paying-users` uses successful payment records.

## Customer subscription cancellation

Customers can cancel their monthly subscription through `POST /api/payment/cancel-subscription`. Send JSON `{ "licenseKey": "...", "email": "..." }` with the license key and purchase email. The endpoint rate-limits attempts and schedules cancellation at the end of the current billing period; the license remains valid through that date. The public site has a dedicated cancellation page at `/cancel-subscription`.

For subscription IDs to be linked to customer licenses, enable these Bachs webhook events for the existing webhook URL: `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`, in addition to `collection.succeeded`. The subscription webhook carries the checkout metadata reference, which the server uses to match the purchase.
