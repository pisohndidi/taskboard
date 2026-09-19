# Инструкция: GitHub + Render + Code Climate

Всё уже подготовлено (код, Dockerfile, render.yaml). Вам нужно выполнить несколько
кликов/команд — примерно 10-15 минут.

## Шаг 1. Создать репозиторий на GitHub

1. Зайдите на https://github.com/new
2. Название: `taskboard` (или любое другое)
3. **Public** (обязательно — закрытый репозиторий не примут)
4. НЕ ставьте галочку "Add a README" — он уже есть
5. Нажмите "Create repository"

Скопируйте команды, которые GitHub покажет в разделе "…or push an existing repository
from the command line", либо выполните из папки проекта:

```bash
cd taskboard
git remote add origin https://github.com/ВАШ_ЛОГИН/taskboard.git
git push -u origin main
```

Если git попросит логин — используйте Personal Access Token вместо пароля
(Settings → Developer settings → Personal access tokens → Generate new token,
scope `repo`).

## Шаг 2. Подключить Qlty Cloud (для бейджа A/B, бывший Code Climate)

Code Climate переехал на **Qlty Cloud** — регистрация и бейдж теперь там.

1. Зайдите на https://qlty.sh/, войдите через GitHub
2. Создайте/выберите workspace → **Projects** → добавьте репозиторий `taskboard`
3. После первого анализа откройте вкладку **Settings** проекта — там будет готовый
   markdown бейджа (для этого репозитория — уже подключено):
   [![Maintainability](https://qlty.sh/gh/pisohndidi/projects/taskboard/maintainability.svg)](https://qlty.sh/gh/pisohndidi/projects/taskboard)

4. Нажмите **Apply** — дождитесь, пока все сервисы соберутся (5-10 минут)
5. Миграции и сид тестовых данных выполняются **автоматически** при каждом
   старте backend-контейнера (см. `backend/docker-entrypoint.sh`) — отдельно
   ничего запускать не нужно даже на бесплатном тарифе Render, где вкладка
   **Shell** недоступна. В логах `taskboard-backend` вы увидите:
   ==> Running database migration...
   Migration applied successfully.
   ==> Running database seed...
   Seed complete.
   Demo login: demo@taskboard.dev / demo12345
   ==> Starting server...
6. Откройте URL сервиса `taskboard-frontend` (что-то вроде
   `https://taskboard-frontend.onrender.com`) — это и есть рабочий деплой.
7. **Важно:** Render присваивает backend-сервису случайный суффикс в адресе
   (например `taskboard-backend-ofu4.onrender.com`, а не ровно
   `taskboard-backend.onrender.com`). После первого деплоя проверьте реальный
   URL backend-сервиса в дашборде Render и убедитесь, что у
   `taskboard-frontend` переменная `VITE_API_URL` указывает именно на него
   (`https://<реальный-адрес-backend>.onrender.com/api`). Обновите значение
   и в `render.yaml` в репозитории (иначе при следующей синхронизации
   Blueprint оно откатится на плейсхолдер), и в дашборде — затем передеплойте
   фронтенд (Manual Deploy).

## Шаг 3. Деплой на Render

1. Зайдите на https://render.com/, зарегистрируйтесь (можно через GitHub — тогда
   не понадобится отдельно подтверждать доступ к репозиторию)
2. Dashboard → **New** → **Blueprint**
3. Выберите репозиторий `taskboard` — Render сам найдёт `render.yaml` в корне
   и предложит создать 3 сервиса: `taskboard-backend`, `taskboard-frontend`,
   `taskboard-db` (Postgres)
4. Нажмите **Apply** — дождитесь, пока все сервисы соберутся (5-10 минут)
5. После первого деплоя backend зайдите в Shell сервиса `taskboard-backend`
   (кнопка "Shell" в дашборде Render) и выполните:
   ```bash
   npm run migrate
   npm run seed
   ```
   Это создаст таблицы и тестового пользователя `demo@taskboard.dev` / `demo12345`.
6. Откройте URL сервиса `taskboard-frontend` (что-то вроде
   `https://taskboard-frontend.onrender.com`) — это и есть рабочий деплой.
7. Если фронтенд обращается не по тому адресу — проверьте в Render, что у
   `taskboard-frontend` переменная `VITE_API_URL` указывает на реальный URL
   вашего backend-сервиса (`.../api`), и передеплойте фронтенд (Manual Deploy).

## Шаг 4. Проверка перед сдачей (чек-лист из гайда)

- [ ] GitHub открывается в режиме инкогнито, репозиторий публичный
- [ ] Деплой (frontend URL) открывается в инкогнито, без 400/500 при основных действиях
- [ ] В README указан рабочий бейдж Code Climate (A или B)
- [ ] В README указана ссылка на деплой
- [ ] Тестовые логин/пароль (`demo@taskboard.dev` / `demo12345`) актуальны — проверьте вход
- [ ] Запишите демонстрацию (GIF/видео до 2 минут): вход → создание карточки →
      перемещение между списками → комментарий. Инструменты: ScreenToGif (Windows),
      Kap (Mac), peek (Linux), или сайт https://ezgif.com для конвертации видео в GIF

После того как деплой заработает — пришлите мне ссылку и, если хотите, GIF/видео,
и я доделаю финальную версию отчёта (docx) с реальными ссылками на деплой и
скриншотами/таблицей трассировки.
