# Chat status and internal notes: what the server needs

The Inbox in the mobile app can mark a chat **Open / Pending / Resolved / Closed** and keep **internal notes**
(team-only, never sent through WhatsApp). The database already has `conversations.status`, and the permissions
`conversations.status` and `conversations.note` already exist, but the API has no endpoints for them and there is
no notes table. Until you add them the app simply hides the status pill and the Note button, so nothing breaks.

## Apply the patch

It was made against the exact files in `whatsapp.zip` and checked with `git apply --check` and `php -l`.
It has **not been run against your database**, so try it on a copy first.

```bash
# in your Laravel backend repo (the folder that contains app/ and routes/)
git apply /path/to/heltog-mobile/docs/patches/backend-notes-status.patch
php artisan migrate
php artisan route:clear
```

What it adds (all inside `InboxController`, same tenant scoping and "agents only see their own chats" rule as the
other inbox actions):

| Endpoint | Permission | Purpose |
| --- | --- | --- |
| `GET /whatsapp/conversations/{id}` | `conversations.view` | One conversation (the chat screen reads its status here) |
| `PUT /whatsapp/conversations/{id}/status` | `conversations.status` | Body `{ "status": "open|pending|resolved|closed" }` |
| `GET /whatsapp/conversations/{id}/notes` | `conversations.view` | Notes, newest first |
| `POST /whatsapp/conversations/{id}/notes` | `conversations.note` | Body `{ "body": "..." }` |
| `DELETE /whatsapp/conversations/{id}/notes/{note}` | `conversations.note` | Author, or anyone with `whatsapp.manage` |

Plus a `conversation_notes` migration and the `ConversationNote` model.

## Worth doing next on the server

- When a customer writes to a **resolved or closed** chat, set its status back to `open` in the WhatsApp webhook, so it
  shows up in the "Open" list again. The patch does not touch the webhook.
- The web app can show the same status and notes with these endpoints.
