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

## Шаг 2. Подключить Code Climate (для бейджа A/B)

1. Зайдите на https://codeclimate.com/, войдите через GitHub
2. "Add a repository" → выберите ваш `taskboard`
3. После первого анализа откройте вкладку **Repo Settings → Badges**
4. Скопируйте markdown вида:
   ```
   [![Maintainability](https://api.codeclimate.com/v1/badges/XXXXXXX/maintainability)](...)
   ```
5. Замените `REPLACE_ME` в `README.md` (в корне и в бейдже) на этот код, закоммитьте:
   ```bash
   git add README.md
   git commit -m "docs: add Code Climate badge"
   git push
   ```

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
