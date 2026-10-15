# Account deletion: what the server and the website need

The mobile app already has **Profile, Delete account**. It calls `POST /api/v1/auth/delete-account`.
That endpoint does not exist in the Laravel backend yet, so until you add it the app shows
"Instant deletion is not switched on for this server yet" and offers to send a deletion request
to support instead. Google Play requires a working in-app deletion path **and** a public web page
where a user can ask for deletion, so both parts below are needed before you submit to the Play Store.

## Quick way: apply the ready-made patches

Both patches were made against the exact files in your `whatsapp.zip` and were checked to apply cleanly
(`git apply --check`). The PHP was syntax-checked with `php -l`, but it has **not been run against your database**,
so test it on a copy first.

```bash
# in your Laravel backend repo (the folder that contains app/ and routes/)
git apply /path/to/heltog-mobile/docs/patches/backend-delete-account.patch

# in your Next.js frontend repo (the folder that contains app/ and package.json)
git apply /path/to/heltog-mobile/docs/patches/frontend-delete-account.patch
```

- `backend-delete-account.patch`: the `deleteAccount` method in `AuthController` and its route.
- `frontend-delete-account.patch`: the new `/delete-account` page, the mobile-app items in the Privacy Policy,
  and "Pizi" renamed to "Heltog SocialFlow" in the Privacy Policy and Terms.

After applying: deploy the backend (`php artisan route:clear` if routes are cached), rebuild and upload the website,
then open `https://frontend.heltog.com/delete-account` to check it. The explanations and the full code below are the
same thing in readable form.

None of this code has been run against real data. Test it on a copy of the database first.

## 1. Backend: `POST /api/v1/auth/delete-account`

### Route (`backend/routes/modules/auth.php`, inside the existing `auth:api` group)

```php
Route::post('/delete-account', [AuthController::class, 'deleteAccount'])->middleware('throttle:5,1');
```

### Controller (`backend/app/Modules/Auth/Controllers/AuthController.php`)

Add the imports `use Illuminate\Support\Facades\DB;` and `use Illuminate\Support\Str;` and this method.

```php
/**
 * Permanently delete the signed-in account.
 * - Agent: their own login is removed; chats they held become unassigned.
 * - Owner: the whole company is removed (same effect as the super admin's "Delete company").
 * - Super admin: refused.
 * A wrong password must be a 422, never a 401: the mobile app signs the user out on any 401.
 */
public function deleteAccount(Request $request): JsonResponse
{
    $user = $request->user();

    if ($user->is_super_admin) {
        return $this->fail('The platform admin account cannot be deleted here.', [], 403);
    }

    $data = $request->validate([
        'password' => ['required', 'string'],
        'delete_company' => ['sometimes', 'boolean'],
    ]);

    if (! Hash::check($data['password'], $user->password)) {
        return $this->fail('The password is incorrect.', ['password' => ['The password is incorrect.']], 422);
    }

    $isOwner = $user->hasRole('tenant-owner');
    if ($isOwner && ! ($data['delete_company'] ?? false)) {
        return $this->fail(
            'Deleting the owner account also deletes the company. Please confirm.',
            ['delete_company' => ['Confirm that the company will be deleted.']],
            422,
        );
    }

    DB::transaction(function () use ($user, $isOwner) {
        $people = $isOwner
            ? User::withoutGlobalScopes()->where('tenant_id', $user->tenant_id)->get()
            : collect([$user]);

        foreach ($people as $person) {
            \App\Models\DeviceToken::withoutGlobalScopes()->where('user_id', $person->id)->delete();

            // Remove personal data first, so it is gone even if rows are only soft-deleted,
            // and so the email address can be registered again later.
            $person->forceFill([
                'name' => 'Deleted user',
                'email' => 'deleted-' . Str::uuid() . '@deleted.invalid',
                'phone' => null,
                'avatar_url' => null,
                'password' => Hash::make(Str::random(40)),
            ])->saveQuietly();
        }

        if ($isOwner) {
            \App\Models\Tenant::find($user->tenant_id)?->delete();
        } else {
            \App\Models\Conversation::withoutGlobalScopes()
                ->where('assigned_agent_id', $user->id)
                ->update(['assigned_agent_id' => null]);
        }

        foreach ($people as $person) {
            $person->delete();
        }
    });

    auth('api')->logout();

    return $this->ok(['message' => 'Your account has been deleted.']);
}
```

Things to check against your models before shipping:

- `User` must allow mass assignment through `forceFill` (it does, `forceFill` ignores `$fillable`) and the
  columns `avatar_url`, `phone` must be nullable.
- If `Tenant` is not soft-deleted, `->delete()` will cascade (or fail) according to your foreign keys.
  This is the same call the super admin's "Delete company" already makes in `CompanyController::destroy`.
- Invoices and payments: keep them. Indian tax rules usually require invoices to be kept for several years.
  Soft-deleting the tenant keeps its invoices; only the personal contact details above are overwritten.
- Add an `AuditLog` entry here if you want a record of who deleted what.

## 2. Website page (Google Play asks for a public "delete account" URL)

Create `frontend/app/delete-account/page.tsx` (same look as `privacy/page.tsx`). Use this URL in the
Play Console, under App content, Data safety, "Delete account URL".

```tsx
export default function DeleteAccount() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif", lineHeight: 1.7, color: "#333" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Delete your Heltog account</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>Heltog SocialFlow by Heltog Technologies Pvt Ltd</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>In the app</h2>
      <p>Open the Heltog app, go to <strong>More, Profile, Delete account</strong>, enter your password and confirm.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>By email</h2>
      <p>
        If you cannot open the app, email <a href="mailto:heltogtechnologies@gmail.com?subject=Account%20deletion%20request" style={{ color: "#2563eb" }}>heltogtechnologies@gmail.com</a> from
        the address you registered with, with the subject &quot;Account deletion request&quot;. We delete the account within 30 days.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>What is deleted</h2>
      <ul>
        <li>Your name, email address, phone number and sign-in details.</li>
        <li>Saved phone notification tokens.</li>
        <li><strong>Company owners:</strong> the whole company workspace, including contacts, conversations, templates, campaigns and the access of every team member.</li>
        <li><strong>Agents:</strong> only your own login. Chats and contacts stay with your company.</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>What we keep</h2>
      <p>Invoices and payment records are kept for the period required by Indian tax and accounting law. Messages stored with Meta (WhatsApp) are governed by Meta&apos;s own policies.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>Related</h2>
      <ul>
        <li><a href="/privacy" style={{ color: "#2563eb" }}>Privacy Policy</a></li>
        <li><a href="/terms" style={{ color: "#2563eb" }}>Terms and Conditions</a></li>
      </ul>
    </div>
  );
}
```

Then rebuild and redeploy the website (`next build` produces the static `out/` folder you upload).

## 3. Add the app to the Privacy Policy

`frontend/app/privacy/page.tsx` describes only the website. Google Play checks that the policy covers what the
app does. Add these items to **Information we collect** and **Data retention**, and update "Last updated":

```tsx
<li><strong>Device information</strong> — a push notification token for your phone, so we can alert you about new messages.</li>
<li><strong>Photos, videos, files and voice notes</strong> — only the ones you choose to attach to a chat or a social post. The app asks for camera, microphone and photo access when you use those features.</li>
<li><strong>Contacts</strong> — your phone&apos;s contacts are read only when you choose &quot;Import from phone contacts&quot;, and only the ones you select are uploaded.</li>
```

```tsx
<p>You can delete your account yourself in the app (More, Profile, Delete account) or at <a href="/delete-account" style={{ color: "#2563eb" }}>/delete-account</a>. We remove your personal data and keep only invoices and payment records that the law requires.</p>
```

Also note the product name: the privacy page says **Pizi** while the app and the rest of the site say
**Heltog SocialFlow**. Use one name everywhere, because Google Play compares the policy with the app listing.

## 4. Play Console checklist

- Privacy policy URL: `https://frontend.heltog.com/privacy`
- Delete account URL: `https://frontend.heltog.com/delete-account`
- Data safety form: declare account info (name, email, phone), messages, photos/videos, audio, contacts,
  device or other IDs (push token) and payment info (handled by Razorpay). State that data is encrypted in transit
  and that users can request deletion.
- The app uses these permissions: camera, microphone, read contacts, notifications, internet.
