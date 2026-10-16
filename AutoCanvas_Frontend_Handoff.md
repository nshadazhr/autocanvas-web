# AutoCanvas Audio Studio — Frontend Handoff

## 1. Project Context

Main AutoCanvas naam ka web application develop kar raha hoon.

- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: NestJS
- Database: PostgreSQL + Prisma 7
- Authentication: Access token + HttpOnly refresh-token cookie
- Audio generation: Google Gemini TTS
- Frontend API calls: Axios

**Important:** Project pehle se kaafi develop ho chuka hai. Existing functionality ko preserve karna hai. Architecture dobara design nahi karna.

Maine previous chat me frontend ka `src(4).zip` upload kiya tha. New chat me bhi ye ZIP attach karunga.

## 2. Existing Frontend Structure

Relevant files:

```text
src/
├── app/
│   ├── api/
│   │   ├── axios.ts
│   │   └── audio-studio/
│   │       ├── audio-stories.api.ts
│   │       ├── audio-stories.types.ts
│   │       └── voices.api.ts
│   │
│   └── (app)/audio/
│       ├── page.tsx
│       ├── audio-studio-dashboard.tsx
│       ├── audio-stories-list.tsx
│       ├── create-project-modal.tsx
│       ├── project-cast.tsx
│       ├── hooks/use-audio-stories.ts
│       ├── stories/[storyId]/page.tsx
│       │
│       └── [audioProjectId]/
│           ├── page.tsx
│           └── project-workspace.tsx
│
├── providers/AuthProvider.tsx
└── lib/
    ├── backend-client.ts
    ├── dummy-data.ts
    └── feature-flags.ts
```

**Important distinction:** Frontend me ek older project-workspace implementation bhi hai jo `backend-client.ts` aur `dummy-data.ts` use karta hai. Naya story-based Audio Studio alag flow hai.

Current focus:

`src/app/(app)/audio/stories/[storyId]/page.tsx`

Dono implementations ko bina samjhe merge ya replace nahi karna.

## 3. Already Implemented Frontend

Uploaded source ke according:

- Audio Stories list with search and status filtering
- Story creation and detail page
- Script editing
- Story analysis API integration
- Character/cast UI
- Real backend voices API
- Cast assignment and save API
- Analyzed scenes display
- Generate Audio tab ka basic UI

`project-cast.tsx` already backend se cast aur voices load karta hai. Isko dobara create nahi karna.

`stories/[storyId]/page.tsx` me Generate Audio tab abhi placeholder hai. Isme real audio-generation integration add karna hai.

Older `project-workspace.tsx` me generation/playback controls hain, lekin woh separate flow hai. Unhe automatically current story-based flow ka completed implementation assume nahi karna.

## 4. Existing Frontend APIs

`audio-stories.api.ts` me:

```text
GET   /audio-stories
POST  /audio-stories
GET   /audio-stories/:id
PATCH /audio-stories/:id
POST  /audio-stories/:id/analyze
GET   /audio-stories/:id/cast
PATCH /audio-stories/:id/cast
```

`voices.api.ts` me:

```text
GET /voices
```

Axios already centralized hai:

`src/app/api/axios.ts`

Isme access token request interceptor aur 401 refresh handling implemented hai. New APIs ko isi existing Axios instance se connect karna hai.

## 5. Backend Audio Generation — Already Working

Backend endpoints:

```text
POST /audio-generation/stories/:storyId/jobs
GET  /audio-generation/jobs/:jobId
POST /audio-generation/jobs/:jobId/retry
```

Generation asynchronous hai.

1. POST se job create hota hai.
2. GET se job status aur progress milti hai.
3. Failed scenes ke liye retry endpoint hai.
4. Successful scenes ka generated audio `SceneAudio` me save hota hai.

Job statuses me PENDING, PROCESSING, COMPLETED, PARTIAL aur FAILED ho sakte hain.

Backend me actual Gemini WAV generation successful test ho chuki hai.

Example:

- Story ID: 2
- Original job ID: 2 — PARTIAL, scene 1 completed
- Retry job ID: 5 — COMPLETED, scene 2 completed
- Dono scenes ki WAV files generate ho chuki hain.

Job response me items ke andar audio object milta hai:

```json
{
	"audio": {
		"id": 4,
		"filePath": "uploads/audio-stories/2/2-14d155a3-98e1-4873-8ca1-7637f0ddf2a7.wav",
		"durationMs": 3451,
		"format": "wav"
	}
}
```

NestJS `main.ts` me `useStaticAssets()` configuration add kar di gayi hai. Browser playback test ka exact result new chat me confirm kar sakte hain.

Production me audio authorization/security ko separately review karna hai.

## 6. Next Frontend Work

Ab existing story-based Generate Audio tab me integrate karna hai:

1. Generate Audio button
2. Backend generation-job creation
3. Job progress polling
4. Scene-wise generation status
5. Completed audio playback
6. Failed scene retry
7. Existing generated audio ko page reload ke baad bhi show karna

Important: Original job aur retry job me completed audio alag jobs me ho sakta hai. Isliye playback ke liye sirf latest job par depend nahi karna. Existing backend read APIs inspect karke correct approach choose karna.

## 7. Development Rules

- Ek time par ek step implement karna.
- Existing code pehle read karna.
- Unnecessary refactoring nahi.
- Existing Prisma schema change nahi.
- Hardcoded mock voice list nahi.
- Existing reusable components reuse karna.
- Local script parser enabled rehna chahiye.
- Gemini-based AI analysis abhi global feature flag se disabled hai; Gemini TTS generation alag functionality hai.
- Existing authentication/refresh-token logic preserve karna.
- Exact existing variables aur function names inspect karne ke baad code suggest karna.
- Backend generation already tested hai; unnecessary Gemini calls mat karwana.
- Roman Hindi me explain karna: kya kar rahe hain, kyun, aur kis file me.

## 8. Where to Resume

**Next step:** Uploaded frontend ZIP inspect karke `src/app/(app)/audio/stories/[storyId]/page.tsx` ke existing Generate Audio tab me API integration start karo.

Sabse pehle current code ka review karo. Phir minimum required files aur changes batao.

Mujhe pura frontend dobara nahi banana. Existing AutoCanvas Audio Studio ko wahi se continue karna hai jahan previous chat me chhoda tha.
