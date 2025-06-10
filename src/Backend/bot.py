import asyncio
import locale
import random
import string
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.enums import ParseMode
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.context import FSMContext
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, KeyboardButton, ReplyKeyboardMarkup, LabeledPrice, ContentType
from aiogram.client.bot import DefaultBotProperties
from config import BOT_TOKEN
from mydb import Database
from datetime import datetime, timedelta

# Ставим русскую локаль для красивых дат
locale.setlocale(locale.LC_TIME, 'ru_RU.UTF-8')

bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()
db = Database()

def t(key, lang="ru", **kwargs):
    texts = {
        "start_ru": "👋 Привет, {name}!\nВыбери действие из меню ниже:",
        "start_en": "👋 Hello, {name}!\nChoose an action from the menu below:",
        "choose_lang_ru": "🌐 Выберите язык:",
        "choose_lang_en": "🌐 Choose your language:",
        "lang_saved_ru": "✅ Язык сохранён.",
        "lang_saved_en": "✅ Language saved.",
        "settings_ru": "🌐 Выберите язык:",
        "settings_en": "🌐 Choose your language:",
        "profile_ru": (
            "👤 <b>Ваш профиль:</b>\n\n"
            "🆔 ID: <code>{user_id}</code>\n"
            "🌐 Язык: {language}\n"
            "🛡️ Админ: {is_admin}\n"
            "💳 Подписка: {sub_status}"
        ),
        "profile_en": (
            "👤 <b>Your profile:</b>\n\n"
            "🆔 ID: <code>{user_id}</code>\n"
            "🌐 Language: {language}\n"
            "🛡️ Admin: {is_admin}\n"
            "💳 Subscription: {sub_status}"
        ),
        "profile_not_found_ru": "❌ Профиль не найден.",
        "profile_not_found_en": "❌ Profile not found.",
        "admin_only_ru": "⛔ Только администратор может выдавать доступ.",
        "admin_only_en": "⛔ Only admin can grant access.",
        "grant_usage_ru": "Использование: /grantaccess user_id кол-во d|h\nПример: /grantaccess 123456789 3d или /grantaccess 123456789 12h",
        "grant_usage_en": "Usage: /grantaccess user_id amount d|h\nExample: /grantaccess 123456789 3d or /grantaccess 123456789 12h",
        "grant_success_ru": "✅ Пользователю {target_id} выдан доступ на {value} {unit}.",
        "grant_success_en": "✅ User {target_id} granted access for {value} {unit}.",
        "grant_format_ru": "Укажите срок в формате 3d (дни) или 12h (часы).",
        "grant_format_en": "Specify period as 3d (days) or 12h (hours).",
        "grant_error_ru": "⚠️ Ошибка: {e}",
        "grant_error_en": "⚠️ Error: {e}",
        "site_link_ru": "Нажмите на кнопку ниже, чтобы открыть сайт:",
        "site_link_en": "Click the button below to open the site:",
        "no_sub_ru": "У тебя нет активной подписки. Купи её через кнопку 💳 Купить подписку.",
        "no_sub_en": "You have no active subscription. Buy it via 💳 Buy subscription.",
        "choose_period_ru": "Выберите период подписки:",
        "choose_period_en": "Choose subscription period:",
        "thanks_ru": "Спасибо за покупку! Ваша подписка активирована на {days} дней.",
        "thanks_en": "Thank you for your purchase! Your subscription is active for {days} days.",
        "my_sub_active_ru": "✅ Твоя подписка активна до: <b>{date}</b>",
        "my_sub_active_en": "✅ Your subscription is active until: <b>{date}</b>",
        "my_sub_none_ru": "❌ У тебя нет активной подписки.",
        "my_sub_none_en": "❌ You have no active subscription.",
        "instruction_ru": (
            "📌 <b>Инструкция по использованию бота:</b>\n\n"
            " 💳 Купить подписку — оформить подписку.\n"
            " /ref — проверить свой код.\n"
            " /activate_ref — активировать подписку за 10 баллов.\n"
            "{access_block}"
            "{one_time_block}"
            "{admin_block}"
            " ⚙️ Настройки — смена языка.\n"
            "\n❓ Если есть вопросы, пишите '@Ur TG Name     '!"
        ),
        "instruction_en": (
            "📌 <b>How to use the bot:</b>\n\n"
            " 💳 Buy subscription — get a subscription.\n"
            " /ref — check your code.\n"
            " /activate_ref — activate subscription for 10 points.\n"
            "{access_block}"
            "{one_time_block}"
            "{admin_block}"
            " ⚙️ Settings — change language.\n"
            "\n❓ If you have questions, write '@Ur TG Name     '!"
        ),
        "access_block_ru": " 🔗 Получить доступ — получить доступ к сайту.\n 📅 Моя подписка — посмотреть дату окончания подписки.\n",
        "access_block_en": " 🔗 Get access — get access to the site.\n 📅 My subscription — see subscription end date.\n",
        "one_time_block_ru": " /one-time-access — однократный доступ на 5 минут.\n",
        "one_time_block_en": " /one-time-access — one-time access for 5 minutes.\n",
        "admin_block_ru": (
            " 💸 Возврат средств — возврат средств.\n"
            "🛡️ /users — количество пользователей и подписчиков.\n"
            "🛡️ /giveadmin — выдать права администратора.\n"
            "🛡️ /grantaccess — выдать доступ на время.\n"
        ),
        "admin_block_en": (
            " 💸 Refund — refund payments.\n"
            "🛡️ /users — users and subscribers count.\n"
            "🛡️ /giveadmin — grant admin rights.\n"
            "🛡️ /grantaccess — grant access for time.\n"
        ),
        "ref_code_ru": (
            "🔗 Ваш реферальный код: <code>{ref_code}</code>\n"
            "👥 Баллов за приглашения: <b>{points}</b>\n\n"
            "Пригласите друзей — пусть они активируют ваш код через <b>/activate_ref &lt;код&gt;</b>.\n"
            "За каждые 10 баллов вы можете получить 1 день подписки."
        ),
        "ref_code_en": (
            "🔗 Your referral code: <code>{ref_code}</code>\n"
            "👥 Referral points: <b>{points}</b>\n\n"
            "Invite friends — let them activate your code via <b>/activate_ref &lt;code&gt;</b>.\n"
            "For every 10 points you can get 1 day of subscription."
        ),
        "ref_usage_ru": "Использование: /activate_ref &lt;реферальный_код&gt;",
        "ref_usage_en": "Usage: /activate_ref &lt;referral_code&gt;",
        "ref_already_used_ru": "Вы уже активировали чей-то реферальный код.",
        "ref_already_used_en": "You have already activated someone's referral code.",
        "ref_own_ru": "Нельзя активировать свой собственный код.",
        "ref_own_en": "You can't activate your own code.",
        "ref_not_found_ru": "Такого кода не существует.",
        "ref_not_found_en": "No such code exists.",
        "ref_activated_ru": "✅ Код активирован! Пользователь получит 1 балл.",
        "ref_activated_en": "✅ Code activated! User will get 1 point.",
        "not_enough_points_ru": "Недостаточно баллов!",
        "not_enough_points_en": "Not enough points!",
        "sub_activated_ru": "🎉 Подписка на 1 день активирована за 10 баллов!",
        "sub_activated_en": "🎉 1 day subscription activated for 10 points!",
        "one_time_used_ru": "⛔ Вы уже использовали доступ на 5 минут. Повторно нельзя.",
        "one_time_used_en": "⛔ You have already used 5-minute access. Can't use again.",
        "one_time_success_ru": "✅ Доступ на 5 минут активирован. Успей воспользоваться сайтом!",
        "one_time_success_en": "✅ 5-minute access activated. Hurry up and use the site!",
        "users_stats_ru": "👥 Всего зарегистрировано пользователей: <b>{total}</b>",
        "users_stats_en": "👥 Total registered users: <b>{total}</b>",
        "active_subs_ru": "📊 Активных подписок: <b>{active}</b>",
        "active_subs_en": "📊 Active subscriptions: <b>{active}</b>",
        "refund_admin_only_ru": "⛔ Только администраторы могут делать возвраты.",
        "refund_admin_only_en": "⛔ Only admins can make refunds.",
        "refund_enter_id_ru": "Введите <b>telegram_payment_charge_id</b> для возврата средств:",
        "refund_enter_id_en": "Enter <b>telegram_payment_charge_id</b> for refund:",
        "refund_not_found_ru": "❌ Платёж не найден.",
        "refund_not_found_en": "❌ Payment not found.",
        "refund_success_ru": "✅ Возврат средств выполнен.",
        "refund_success_en": "✅ Refund completed.",
        "refund_error_ru": "⚠️ Ошибка при возврате: {e}",
        "refund_error_en": "⚠️ Refund error: {e}",
    }
    return texts.get(f"{key}_{lang}", texts.get(f"{key}_ru", "")).format(**kwargs)

async def get_menu_keyboard(user_id: int):
    user = await db.get_user(user_id)
    is_admin = user and user['is_admin']
    subscription = user and user['subscription']
    now = datetime.utcnow()

    lang = user["language_code"] if user else "ru"

    buttons = [
        [KeyboardButton(text="💳 Купить подписку" if lang == "ru" else "💳 Buy subscription")],
        [KeyboardButton(text="🎓 Инструкция" if lang == "ru" else "🎓 Instruction"),
         KeyboardButton(text="⚙️ Настройки" if lang == "ru" else "⚙️ Settings")],
    ]

    if is_admin or (subscription and subscription > now):
        buttons.insert(0, [KeyboardButton(text="🔗 Получить доступ" if lang == "ru" else "🔗 Get access")])
        buttons.insert(1, [KeyboardButton(text="📅 Моя подписка" if lang == "ru" else "📅 My subscription")])

    if is_admin:
        buttons.append([KeyboardButton(text="💸 Возврат средств" if lang == "ru" else "💸 Refund")])

    menu_kb = ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)
    return menu_kb

class LanguageState(StatesGroup):
    choosing = State()

@dp.message(Command("start"))
async def cmd_start(message: types.Message, state: FSMContext):
    menu_kb = await get_menu_keyboard(message.from_user.id)
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    lang = user["language_code"] if user else "ru"

    if not user:
        await db.create_user(user_id)
        lang = "ru"

    if not user or not user["is_initialized"]:
        lang_kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🇷🇺 Русский", callback_data="lang:ru")],
            [InlineKeyboardButton(text="🇬🇧 English", callback_data="lang:en")]
        ])
        await message.answer(t("choose_lang", lang=lang), reply_markup=lang_kb)
        await state.set_state(LanguageState.choosing)
    else:
        await message.answer(
            t("start", lang=lang, name=message.from_user.full_name), reply_markup=menu_kb
        )

@dp.message(lambda m: m.text in ["⚙️ Настройки", "⚙️ Settings"])
async def open_settings(message: types.Message):
    user = await db.get_user(message.from_user.id)
    lang = user["language_code"] if user else "ru"
    lang_kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🇷🇺 Русский", callback_data="lang:ru")],
        [InlineKeyboardButton(text="🇬🇧 English", callback_data="lang:en")]
    ])
    await message.answer(t("settings", lang=lang), reply_markup=lang_kb)

@dp.callback_query(lambda c: c.data.startswith("lang:"))
async def set_language(callback: types.CallbackQuery, state: FSMContext):
    menu_kb = await get_menu_keyboard(callback.from_user.id)
    lang_code = callback.data.split(":")[1]
    user_id = callback.from_user.id

    await db.set_user_language(user_id, lang_code)
    await db.set_user_initialized(user_id)

    await callback.message.edit_text(t("lang_saved", lang=lang_code))
    await callback.message.answer(t("start", lang=lang_code, name=callback.from_user.full_name), reply_markup=menu_kb)
    await state.clear()


@dp.message(Command("giveadmin"))
async def give_admin(message: types.Message):
    user = await db.get_user(message.from_user.id)
    lang = user["language_code"] if user else "ru"
    if message.from_user.id != 6660631433:
        await message.answer("⛔ Только главный админ может выдавать права." if lang == "ru" else "⛔ Only the main admin can grant rights.")
        return

    parts = message.text.split()
    if len(parts) != 2:
        await message.answer("Использование: /giveadmin {user_id}" if lang == "ru" else "Usage: /giveadmin {user_id}")
        return

    try:
        target_id = int(parts[1])
        await db.set_admin(target_id)
        await message.answer(f"✅ Пользователь {target_id} теперь администратор." if lang == "ru" else f"✅ User {target_id} is now admin.")
    except Exception as e:
        await message.answer(f"⚠️ Ошибка: {e}" if lang == "ru" else f"⚠️ Error: {e}")


@dp.message(Command("profile"))
async def profile(message: types.Message):
    user_id = message.from_user.id
    user = await db.get_user_profile(user_id)
    lang = user["language_code"] if user else "ru"

    if not user:
        await message.answer(t("profile_not_found", lang=lang))
        return

    is_admin = "✅ Да" if lang == "ru" else ("✅ Yes" if user["is_admin"] else "❌ No")
    sub_end = user["subscription"]
    if sub_end and sub_end > datetime.utcnow():
        sub_status = f"✅ до {sub_end.strftime('%d %B %Y')}" if lang == "ru" else f"✅ until {sub_end.strftime('%d %B %Y')}"
    else:
        sub_status = "❌ Нет подписки" if lang == "ru" else "❌ No subscription"

    language = "Русский" if lang == "ru" else "English"
    await message.answer(
        t("profile", lang=lang, user_id=user_id, language=language, is_admin=is_admin, sub_status=sub_status)
    )


@dp.message(Command("grantaccess"))
async def grant_access(message: types.Message):
    user = await db.get_user(message.from_user.id)
    lang = user["language_code"] if user else "ru"
    if not user or not user['is_admin']:
        await message.answer(t("admin_only", lang=lang))
        return

    parts = message.text.split()
    if len(parts) != 3:
        await message.answer(t("grant_usage", lang=lang))
        return

    try:
        target_id = int(parts[1])
        period = parts[2].lower()
        if period.endswith('d'):
            value = int(period[:-1])
            delta = timedelta(days=value)
            unit = "дней" if lang == "ru" else "days"
        elif period.endswith('h'):
            value = int(period[:-1])
            delta = timedelta(hours=value)
            unit = "часов" if lang == "ru" else "hours"
        else:
            await message.answer(t("grant_format", lang=lang))
            return

        now = datetime.now()
        await db.grant_access(target_id, delta, now)
        await message.answer(t("grant_success", lang=lang, target_id=target_id, value=value, unit=unit))
    except Exception as e:
        await message.answer(t("grant_error", lang=lang, e=e))


@dp.message(lambda m: m.text in ["🔗 Получить доступ", "🔗 Get access"])
async def send_site_link(message: types.Message):
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    lang = user["language_code"] if user else "ru"
    sub_end = await db.get_subscription(user_id)
    if sub_end and sub_end > datetime.utcnow():
        web_app_url = "https://check-bot.top"
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🌐 Перейти на сайт" if lang == "ru" else "🌐 Open site", web_app=types.WebAppInfo(url=web_app_url))]
        ])
        await message.answer(t("site_link", lang=lang), reply_markup=kb)
    else:
        await message.answer(t("no_sub", lang=lang))


@dp.message(lambda m: m.text in ["💳 Купить подписку", "💳 Buy subscription"])
async def buy_subscription(message: types.Message):
    user = await db.get_user(message.from_user.id)
    lang = user["language_code"] if user else "ru"
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="1 неделя" if lang == "ru" else "1 week", callback_data="sub_7")],
        [InlineKeyboardButton(text="2 недели" if lang == "ru" else "2 weeks", callback_data="sub_14")],
        [InlineKeyboardButton(text="1 месяц" if lang == "ru" else "1 month", callback_data="sub_30")],
    ])
    await message.answer(t("choose_period", lang=lang), reply_markup=keyboard)

@dp.callback_query(lambda c: c.data and c.data.startswith('sub_'))
async def process_subscription_choice(callback_query: types.CallbackQuery):
    days = int(callback_query.data.split('_')[1])
    price = {
        7: 1,
        14: 2,
        30: 3
    }[days]
    user = await db.get_user(callback_query.from_user.id)
    lang = user["language_code"] if user else "ru"

    prices = [LabeledPrice(label=f"Подписка на {days} дней" if lang == "ru" else f"Subscription for {days} days", amount=price)]

    await bot.send_invoice(
        chat_id=callback_query.from_user.id,
        title=f"Подписка на {days} дней" if lang == "ru" else f"Subscription for {days} days",
        description=f"Оплата подписки на {days} дней" if lang == "ru" else f"Payment for {days} days subscription",
        payload=f"subscription_{days}_{callback_query.from_user.id}",
        provider_token="",  # вставь свой токен
        currency="XTR",
        prices=prices,
        start_parameter="subscription"
    )
    await callback_query.answer()

@dp.pre_checkout_query()
async def pre_checkout_query(pre_checkout_q: types.PreCheckoutQuery):
    await bot.answer_pre_checkout_query(pre_checkout_q.id, ok=True)

@dp.message(F.successful_payment)
async def successful_payment(message: types.Message):
    if message.content_type == ContentType.SUCCESSFUL_PAYMENT:
        payment = message.successful_payment
        user_id = message.from_user.id
        user = await db.get_user(user_id)
        lang = user["language_code"] if user else "ru"

        payload = payment.invoice_payload
        days = 30
        if payload.startswith("subscription_"):
            try:
                days = int(payload.split("_")[1])
            except Exception:
                days = 30

        now = datetime.now()
        await db.grant_access(user_id, timedelta(days=days), now)

        await db.record_payment(
            user_id=user_id,
            telegram_payment_charge_id=payment.telegram_payment_charge_id,
            provider_payment_charge_id=payment.provider_payment_charge_id,
            amount=payment.total_amount
        )
        await message.answer(t("thanks", lang=lang, days=days))


@dp.message(lambda m: m.text == "💳 Купить подписко" and m.from_user.id == 6660631433)
async def fake_buy_subscription(message: types.Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="1 неделя (тест)", callback_data="fake_sub_7")],
        [InlineKeyboardButton(text="2 недели (тест)", callback_data="fake_sub_14")],
        [InlineKeyboardButton(text="1 месяц (тест)", callback_data="fake_sub_30")],
    ])
    await message.answer("Тестовая выдача подписки (для главного админа):", reply_markup=keyboard)

@dp.callback_query(lambda c: c.data and c.data.startswith('fake_sub_'))
async def process_fake_subscription(callback_query: types.CallbackQuery):
    days = int(callback_query.data.split('_')[2])
    now = datetime.now()
    await db.grant_access(callback_query.from_user.id, timedelta(days=days), now)
    await callback_query.answer()
    await callback_query.message.answer(f"✅ Тестовая подписка на {days} дней выдана (без оплаты).")


@dp.message(lambda m: m.text in ["📅 Моя подписка", "📅 My subscription"])
async def my_subscription(message: types.Message):
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    lang = user["language_code"] if user else "ru"
    sub_end = await db.get_subscription(user_id)
    if sub_end and sub_end > datetime.utcnow():
        formatted_date = sub_end.strftime("%d %B %Y %H:%M")
        await message.answer(t("my_sub_active", lang=lang, date=formatted_date))
    else:
        await message.answer(t("my_sub_none", lang=lang))


@dp.message(lambda m: m.text in ["🎓 Инструкция", "🎓 Instruction"])
async def instruction(message: types.Message):
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    lang = user["language_code"] if user else "ru"
    is_admin = user and user['is_admin']
    subscription = user and user['subscription']
    now = datetime.utcnow()

    access_block = t("access_block", lang=lang) if (is_admin or (subscription and subscription > now)) else ""
    one_time_block = t("one_time_block", lang=lang) if not user['used_one_time_access'] else ""
    admin_block = t("admin_block", lang=lang) if is_admin else ""

    await message.answer(
        t("instruction", lang=lang, access_block=access_block, one_time_block=one_time_block, admin_block=admin_block),
        parse_mode="HTML"
    )


@dp.message(Command("users"))
async def users_stats(message: types.Message):
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    lang = user["language_code"] if user else "ru"

    if not user or not user['is_admin']:
        await message.answer(t("admin_only", lang=lang))
        return

    total_users = await db.get_user_count()
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📊 Кол-во активных подписок" if lang == "ru" else "📊 Active subscriptions", callback_data="stats:subs")]
    ])

    await message.answer(t("users_stats", lang=lang, total=total_users), reply_markup=kb)

@dp.callback_query(lambda c: c.data == "stats:subs")
async def show_active_subs(callback: types.CallbackQuery):
    user = await db.get_user(callback.from_user.id)
    lang = user["language_code"] if user else "ru"
    active_subs = await db.get_active_subscription_count()
    await callback.message.answer(t("active_subs", lang=lang, active=active_subs))
    await callback.answer()


class RefundState(StatesGroup):
    waiting_for_payment_id = State()

@dp.message(lambda m: m.text in ["💸 Возврат средств", "💸 Refund"])
async def refund_start(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    lang = user["language_code"] if user else "ru"

    if not user['is_admin']:
        await message.answer(t("refund_admin_only", lang=lang))
        return
    await message.answer(t("refund_enter_id", lang=lang))
    await state.set_state(RefundState.waiting_for_payment_id)

@dp.message(RefundState.waiting_for_payment_id)
async def refund_payment(message: types.Message, state: FSMContext):
    charge_id = message.text.strip()
    user = await db.get_user(message.from_user.id)
    lang = user["language_code"] if user else "ru"

    async with db.pool.acquire() as conn:
        payment = await conn.fetchrow("SELECT * FROM payments WHERE telegram_payment_charge_id = $1", charge_id)

    if not payment:
        await message.answer(t("refund_not_found", lang=lang))
        await state.clear()
        return

    try:
        await bot.refund_star_payment(
            user_id=payment['user_id'],
            telegram_payment_charge_id=charge_id
        )
        await message.answer(t("refund_success", lang=lang))
        await state.clear()
    except Exception as e:
        await message.answer(t("refund_error", lang=lang, e=e))
        await state.clear()


@dp.message(Command("one-time-access"))
async def one_time_access(message: types.Message):
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    lang = user["language_code"] if user else "ru"
    has_used = await db.has_used_one_time_access(user_id)

    if has_used:
        await message.answer(t("one_time_used", lang=lang))
        return

    await db.set_one_time_access_used(user_id)
    now = datetime.now()
    await db.grant_access(user_id, timedelta(minutes=1), now)
    await message.answer(t("one_time_success", lang=lang))


def generate_ref_code(length=8):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

@dp.message(Command("ref"))
async def show_ref_info(message: types.Message):
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    lang = user["language_code"] if user else "ru"
    if not user:
        await message.answer("Сначала воспользуйтесь /start" if lang == "ru" else "Please use /start first")
        return

    ref_code = user.get("ref_code")
    if not ref_code:
        ref_code = generate_ref_code()
        await db.set_ref_code(user_id, ref_code)

    points = user.get("ref_points", 0)
    text = t("ref_code", lang=lang, ref_code=ref_code, points=points)
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Активировать подписку за 10 баллов" if lang == "ru" else "Activate subscription for 10 points", callback_data="ref:activate")]
    ])
    await message.answer(text, reply_markup=kb)

@dp.message(Command("activate_ref"))
async def activate_ref(message: types.Message):
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    lang = user["language_code"] if user else "ru"
    if not user:
        await message.answer("Сначала воспользуйтесь /start" if lang == "ru" else "Please use /start first")
        return

    parts = message.text.split()
    if len(parts) != 2:
        await message.answer(t("ref_usage", lang=lang))
        return

    ref_code = parts[1]
    if user.get("used_ref_code"):
        await message.answer(t("ref_already_used", lang=lang))
        return
    if ref_code == user.get("ref_code"):
        await message.answer(t("ref_own", lang=lang))
        return

    ref_owner = await db.get_user_by_ref_code(ref_code)
    if not ref_owner:
        await message.answer(t("ref_not_found", lang=lang))
        return

    await db.set_used_ref_code(user_id, ref_code)
    await db.add_ref_point(ref_owner["user_id"])
    await message.answer(t("ref_activated", lang=lang))

@dp.callback_query(lambda c: c.data == "ref:activate")
async def activate_ref_subscription(callback: types.CallbackQuery):
    user_id = callback.from_user.id
    user = await db.get_user(user_id)
    lang = user["language_code"] if user else "ru"
    points = user.get("ref_points", 0)
    if points < 10:
        await callback.answer(t("not_enough_points", lang=lang), show_alert=True)
        return
    now = datetime.now()
    await db.grant_access(user_id, timedelta(days=1), now)
    await db.remove_ref_points(user_id, 10)
    await callback.message.answer(t("sub_activated", lang=lang))
    await callback.answer()


@dp.message(Command("stars"))
async def show_stars(message: types.Message):
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    lang = user["language_code"] if user else "ru"
    stars = user.get("stars", 0)
    await message.answer(f"⭐️ У вас {stars} звёзд." if lang == "ru" else f"⭐️ You have {stars} stars.")


async def remove_expired_subscriptions():
    while True:
        now = datetime.now()
        async with db.pool.acquire() as conn:
            await conn.execute(
                "UPDATE users SET subscription = NULL WHERE subscription IS NOT NULL AND subscription < $1",
                now
            )
        await asyncio.sleep(5 * 60) # данные очищаются каждые 5 минут, можно изменить на любое другое время, например на больше чтобы уменьшить нагрузку на базу данных
        print(f"Expired subscriptions removed at {now.strftime('%Y-%m-%d %H:%M:%S')}")

async def main():
    await db.connect()
    asyncio.create_task(remove_expired_subscriptions())
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())