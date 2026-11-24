# CityAI

CityAI şəhər infrastrukturu ilə bağlı problemləri (yol, işıqlandırma, su, təmizlik və digər mövzular) bildirmək və müraciətin gedişini izləmək üçün veb platformadır. Müraciətə şəkil və ya video əlavə edilə bilər; mövcud AI inteqrasiyası media materialını təhlil edib ilkin kateqoriya və təsvir təklif edir.

**Canlı sayt:** [cityai-asan.vercel.app](https://cityai-asan.vercel.app)

## İmkanlar

- Şəhər problemi barədə müraciət yaratmaq və media əlavə etmək
- Mümkün olduqda məkan məlumatını daxil etmək
- AI vasitəsilə ilkin analiz almaq və nəticəni istifadəçi tərəfindən yoxlamaq
- İzləmə kodu ilə müraciətin statusuna baxmaq
- Əvvəlki və sonrakı vəziyyətləri müqayisə etmək
- Admin panelindən daxil olan müraciətləri idarə etmək
- Azərbaycan dilində mobil uyğun interfeys

AI nəticəsi ilkin təklifdir; müraciətin yekun qiymətləndirilməsi məsul şəxslər tərəfindən aparılır.

## Texnologiyalar

- Next.js 15, React 18, TypeScript
- Supabase: PostgreSQL, Auth və Storage
- Gemini API (server tərəfdə), DeepSeek isə konfiqurasiya olunduqda alternativ analiz provayderi kimi
- Vercel

## Lokal işə salma

Tələblər: Node.js 20 və npm.

```bash
git clone https://github.com/etikhacker/cityai.git
cd cityai
npm install
```

Kök qovluqda `.env.local` yaradın və aşağıdakı dəyişənləri uyğun dəyərlərlə doldurun:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
CITYAI_ADMIN_PASSWORD=
CITYAI_SERVER_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` bəzi Supabase konfiqurasiyalarında `SUPABASE_SECRET_KEY` ilə əvəz oluna bilər. AI analiz üçün `GEMINI_API_KEY` tələb olunur. `DEEPSEEK_API_KEY` və `AI_PROVIDER` yalnız DeepSeek provayderindən istifadə ediləcəksə konfiqurasiya edilir.

`CITYAI_SERVER_SECRET` ən azı 32 simvolluq, kriptoqrafik təsadüfi server sirri olmalıdır. Bu dəyərləri Git-ə əlavə etməyin, brauzerə ötürməyin və ictimai söhbətlərdə paylaşmayın. `NEXT_PUBLIC_` prefiksli dəyişənlər brauzerə açıq ola bilər; yalnız ictimai Supabase URL və anon/publishable açarı üçün istifadə edin.

Sonra:

```bash
npm run dev
```

Sayt [http://localhost:3000](http://localhost:3000) ünvanında açılacaq.

## Yoxlamalar

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Əsas səhifələr

- `/` — ana səhifə
- `/muraciet` — müraciət yaratmaq
- `/izle` — müraciəti izləmək
- `/muqayise` — vəziyyət müqayisəsi
- `/haqqimizda` — platforma haqqında
- `/admin` — admin paneli

## Təhlükəsizlik qeydi

İstehsal mühitində Supabase migration-larını yalnız uyğun backup və ayrıca təsdiqlənmiş rollout planı ilə tətbiq edin. Secret-ləri client koduna, repozitoriyə və loglara daxil etməyin.

## Lisenziya

Repo daxilində ayrıca lisenziya faylı yoxlanılmayıb; istifadə və yayım hüquqları üçün repository sahibinə müraciət edin.
