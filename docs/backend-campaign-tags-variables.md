# Campaign audience by tag, and campaign variables: backend files

Contact tags are stored as text in `contacts.tag_list` ("VIP, New Delhi"). The server's campaign code read a different,
never-filled table (`contact_tag`) and ignored `campaigns.variable_mapping` when sending. These 5 files fix both.
The changes only **add** things; a campaign without tags or a `variable_mapping` is created and sent exactly as before.

Copy each file from `docs/backend-files/` into the same path of the Laravel backend (they are the full files, with your
existing code and the additions). Then:

```bash
php artisan route:clear
```

No migration is needed.

| File | What was added |
| --- | --- |
| `app/Models/Contact.php` | `scopeWithTag` and `scopeWithAnyTag`: match whole tags in `tag_list` (so "VIP" never matches a name or a number). `use Illuminate\Database\Eloquent\Builder;` |
| `app/Modules/Campaigns/Controllers/CampaignController.php` | `store()`: `audience_filter.tags` now uses `withAnyTag` instead of the empty `tags` relation. |
| `app/Modules/Campaigns/Services/CampaignSendService.php` | `buildComponents()` and `resolveValue()`: fills the body variables and the media header for each contact from `variable_mapping`. `process()` also loads `template.components`. |
| `app/Modules/Contacts/Controllers/ContactController.php` | `tagNames()` (new) and a `?tag_name=` filter on `index()`. |
| `routes/modules/contacts.php` | `GET /contacts/tag-names`, placed above `/{uuid}`. |

## How it behaves

`POST /campaigns` body (all optional):

```json
{
  "audience_filter": { "source": "import", "tags": ["VIP", "Delhi"] },
  "variable_mapping": { "1": "{first_name}", "2": "Diwali offer", "header_media_url": "https://..." }
}
```

- `tags`: a contact with **any** of the tags is included. `source` narrows it further. Blocked and opted-out contacts are
  always left out.
- `variable_mapping`: numeric keys are the body variables `{{1}}`, `{{2}}`. A value is plain text, a contact field name
  (`name`, `first_name`, `phone`, `email`, `company`) or text with `{name}`-style placeholders. A missing name becomes
  "there", any other empty field "-". `header_media_url` is the image / video / document link for templates with a
  media header.
- `GET /contacts/tag-names` returns `{ tags: [{ name, contacts_count }] }`, most used first.
- `GET /contacts?tag_name=VIP` lists the contacts that carry the tag.

The mobile app checks `GET /contacts/tag-names` once. If it answers, the app shows the tag picker, the variable fields and
the header link in the campaign form, and a tag filter in Contacts. If not (404), it behaves as before.

## Try it

1. `GET /api/v1/contacts/tag-names` should list your tags.
2. Create a campaign with `audience_filter.tags` and check `total_recipients` on the result.
3. Use a template with a variable and one test contact, start the campaign and look at the message that arrives.
