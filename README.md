# CityAI

CityAI şəhər infrastrukturu ilə bağlı problemləri (yol, işıqlandırma, su, təmizlik, yaşıllıq və digər mövzular) bildirmək və müraciətin gedişini izləmək üçün veb platformadır. Müraciətə şəkil və ya video əlavə edilə bilər; AI şəkli təhlil edib ilkin kateqoriya, təsvir və təcili dərəcəsi təklif edir.

**Canlı sayt:** [cityai-asan.vercel.app](https://cityai-asan.vercel.app)

## İmkanlar

- Müraciət yaratmaq, şəkil/video əlavə etmək və məkan (GPS və ya ünvan) göstərmək
- AI ilə ilkin analiz: kateqoriya, təsvir, təcili dərəcə, məsul qurum təklifi
- Qısa izləmə kodu (`AZE-XXXXXXXX`) ilə statusu və icra tarixçəsini izləmək
- İstəyə bağlı e-poçt ünvanına izləmə kodunun göndərilməsi
- Əvvəlki və sonrakı vəziyyətin foto ilə müqayisəsi
- Operator üçün admin paneli: növbə, status dəyişikliyi, media baxışı
- Azərbaycan dilində mobil uyğun interfeys

AI nəticəsi ilkin təklifdir; yekun qiymətləndirməni məsul şəxslər aparır.

> **Video analizi hazırda söndürülüb.** Aktiv provayder (DeepSeek) yalnız şəkil qəbul edir. Videolar müraciətə əlavə olunur, AI isə onları təhlil etmir. Video analizini qaytarmaq üçün `AI_PROVIDER=gemini` + `GEMINI_API_KEY` lazımdır və `/api/analyze` marşrutundakı `VIDEO_ANALYSIS_DISABLED` bloku silinməlidir.

## İzləmə kodu

- Format: `AZE-` + 8 simvol (məs. `AZE-7K4M9QRT`)
- Əlifbada qarışıq simvollar yoxdur (`0 1 I L O U`), telefonda və kağızda səhv oxunmasın
- Köhnə kodlar (`MZB-<32 hex>`, `MZB-XXXXXX`) hələ də qəbul olunur
- Kod göndərmədən dərhal sonra ekranda göstərilir, kopyalama düyməsi var
- E-poçt daxil edilibsə və `RESEND_API_KEY` konfiqurasiya olunubsa, kod e-poçtla da göndərilir
- Kod itərsə, onu yalnız admin panelindən və ya Supabase-dəki `muracietler.tracking_code` sütunundan tapmaq olar

## Admin paneli

`/admin` (və ehtiyat ünvan `/admin-cx7k9`) — `CITYAI_ADMIN_PASSWORD` ilə giriş:

- Daxil olan müraciətlərin növbəsi, koda/kateqoriyaya görə axtarış
- Status dəyişikliyi (baxış, icrada, həll olundu, rədd edildi) və tarixçəyə qeyd
- Media faylların baxışı, əvvəl/sonra müqayisəsi
- Operator qeydləri

## Texnologiyalar

- Next.js 15, React 18, TypeScript
- Supabase: PostgreSQL, Storage, RLS
- AI: DeepSeek (`deepseek-flash`, görüntü dəstəyi) və ya Gemini — `AI_PROVIDER` ilə seçilir
- E-poçt: Resend (istəyə bağlı)
- Vercel

## Lokal işə salma

Tələblər: Node.js 20 və npm.

```bash
git clone https://github.com/etikhacker/cityai.git
cd cityai
npm install
```

Kök qovluqda `.env.local` yaradın (`.env.local.example` şablonundan):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CITYAI_SERVER_SECRET=
CITYAI_ADMIN_PASSWORD=

# AI — DeepSeek açarı varsa avtomatik seçilir
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-flash

# Gemini (yalnız video analizi və ya AI_PROVIDER=gemini üçün)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=gemini-3.7-flash

# E-poçt (istəyə bağlı)
RESEND_API_KEY=
CITYAI_EMAIL_FROM=CityAI <kod@your-domain.az>
```

Qeydlər:

- `NEXT_PUBLIC_*` dəyərləri **build zamanı** koda yazılır — dəyişdikdən sonra yenidən deploy lazımdır
- `SUPABASE_SERVICE_ROLE_KEY` heç vaxt `NEXT_PUBLIC_` prefiksi ilə yazılmamalıdır
- `CITYAI_SERVER_SECRET` ən azı 32 təsadüfi simvol olmalıdır
- `SUPABASE_SECRET_KEY` də (yeni Supabase adlandırması) `SUPABASE_SERVICE_ROLE_KEY` yerinə qəbul olunur

Sonra:

```bash
npm run dev
```

Sayt [http://localhost:3000](http://localhost:3000) ünvanında açılacaq.

## Verilənlər bazası

`supabase/migrations/` qovluğundakı SQL faylları ardıcıl tətbiq olunmalıdır:

- cədvəllər, RLS siyasətləri və storage bucket-ləri
- `cityai_check_rate_limit` funksiyası — olmadan API endpoint-ləri qəsdən 503 qaytarır
- `muracietler.contact_email` / `contact_phone` sütunları (bu sütunlar olmadan köçürmə yenə işləyir, sadəcə əlaqə məlumatı saxlanmır)

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

İstehsal mühitində Supabase migration-larını yalnız uyğun backup və ayrıca təsdiqlənmiş rollout planı ilə tətbiq edin. Secret-ləri client koduna, repozitoriyə və loglara daxil etməyin. İstifadəçi e-poçt/telefon məlumatı şəxsi məlumatdır — yalnız operator panelində görünür, ictimai API cavabına daxil edilmir.

## Lisenziya

Repo daxilində ayrıca lisenziya faylı yoxdur; istifadə və yayım hüquqları üçün repository sahibinə müraciət edin.
