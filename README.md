# COLORS

COLORS is a multi-user web app where each user logs in, adds colors to a personal list, and searches their saved colors. Every color is scoped to a user ID, so two users see separate lists. It was built for COP 4331C at UCF to demonstrate a LAMP deployment on a remote Linux server.

## Technologies

- Ubuntu 24.04 on a DigitalOcean droplet
- Apache 2
- MySQL 8
- PHP 8
- Plain HTML, CSS, and vanilla JavaScript
- `md5.js` for hashing the password client side

## Repository structure

```
colors-lamp/
├── api/            PHP endpoints that talk to MySQL (Login, AddColor, SearchColors)
├── db/             Database schema and seed data
└── public/         Static frontend: HTML pages, CSS, and JS (including md5.js)
```

## API endpoints

All endpoints are POST requests with `Content-Type: application/json` and return JSON.

| Endpoint | Request body | Response body |
|---|---|---|
| `Login.php` | `login`, `password` | `id`, `firstName`, `lastName`, `error` |
| `AddColor.php` | `userId`, `color` | `error` |
| `SearchColors.php` | `userId`, `search` | `results`, `error` |

## Setup

1. Load `db/schema.sql` into MySQL. This creates the `COP4331` database along with the `Users` and `Colors` tables, and seeds two accounts and a starter list of colors.
2. Create a MySQL user for the app and grant it privileges on the `COP4331` database.
3. Copy the contents of `public/` into the Apache web root, and copy `api/` beneath it so the endpoints are reachable under the same site.
4. On the server, copy `api/config.example.php` to `api/config.php` and fill in the real database host, user, password, and name. `config.php` is gitignored so credentials never reach the repository.
5. Set `urlBase` in `public/js/code.js` to the deployment address, for example `http://YOUR_SERVER_IP/api`.

## Running the application

Open the site in a browser and log in with one of the seeded accounts:

- `AYadavally` / `COP4331`
- `SamH` / `Test`

After logging in, add colors to your list and search them. Search does partial matching, so typing `light` returns `Light Blue`, `Light Gray`, and any other saved color containing that substring.

## Assumptions and limitations

- Passwords are hashed with MD5 on the client side, following the course starter code. This is not production grade: a real deployment would hash server side with `password_hash` and bcrypt instead.
- The site is served over plain HTTP with no TLS.
- There is no registration flow. Users are seeded directly into the database via `db/schema.sql`.
- There are no server-side sessions. The frontend stores the user ID after login and sends it with each subsequent request, so a modified client could request another user's data.
- JSON responses are built by hand with string concatenation instead of `json_encode`, which follows the course starter code but means an unescaped quote in a value could break the response.
- Colors can be added and searched, but not edited or deleted.

## AI Assistance Disclosure

This project was developed with assistance from a generative AI tool, disclosed per class policy:

- **Tool**: Claude Sonnet 5 (Anthropic), accessed via Claude Code
- **Dates**: September 24, 2026
- **Scope**: Organizing the repository into `api/`, `db/`, and `public/`; confirming that `Login.php`, `AddColor.php`, and `SearchColors.php` load database credentials from a gitignored `config.php` (via `config.example.php`) instead of hardcoding them, and adding inline attribution comments to that effect; drafting this README; and structuring the Git history into logical commits
- **Use**: Documentation generation, code review/verification, and repository/version-control workflow. No application logic, SQL, or endpoint behavior was authored by AI; that code comes from the course starter code and lab instructions

All AI-assisted changes were reviewed and verified manually, including confirming with `git grep` that no credentials remain in the repository or its history, and testing the endpoints on the live server.
