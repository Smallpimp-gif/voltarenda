// Генерация договора аренды (.docx) по финальному шаблону (эталон — Договор
// №33). Реквизиты Арендодателя фиксированы; данные Арендатора и параметры
// Имущества/выкупа — из заявки (см. lib/bikes.ts как источник истины цифр).
//
// Работает в Node и в Cloudflare Workers: docx — чистый JS, на выходе Blob.

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TableLayoutType,
} from "docx";

export type ContractTenant = {
  fio: string;
  birthDate?: string;
  birthPlace?: string;
  passportSeries?: string;
  passportNumber?: string;
  issuedBy?: string;
  issueDate?: string;
  departmentCode?: string;
  regAddress?: string;
  factAddress?: string;
  phone?: string;
  telegram?: string;
};

export type ContractKind = "аренда" | "выкуп";

// Параметры Имущества и оценочная стоимость (из выбранной комплектации).
export type ContractBike = {
  model: string; // «U2 pro»
  batteryCount: number; // 1
  batteryParams: string; // «63V/65Ah»
  valuation: { bike: number; batteryEach: number; charger: number; keysLock: number; box: number };
};

export type ContractData = {
  number: number;
  dateText: string; // напр. «27» июня 2026 г.
  kind: ContractKind;
  tenant: ContractTenant;
  bike: ContractBike;
  // Условия выкупа — обязательны при kind==="выкуп".
  buyout?: { weekly: number; weeks: number };
  // Условия аренды — обязательны при kind==="аренда".
  rent?: { weekly: number; deposit: number };
};

const rub = new Intl.NumberFormat("ru-RU");
const FILL = "________________";

// --- сумма и число прописью (для юр. чёткости, как в эталоне) ----------

const ONES_M = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const ONES_F = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const TEENS = [
  "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать",
  "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать",
];
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const HUNDREDS = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

// n: 0..999 → слова. fem — женский род единиц (для «тысяч»).
function triple(n: number, fem: boolean): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  if (h) parts.push(HUNDREDS[h]);
  if (t === 1) {
    parts.push(TEENS[u]);
  } else {
    if (t) parts.push(TENS[t]);
    if (u) parts.push((fem ? ONES_F : ONES_M)[u]);
  }
  return parts.join(" ");
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

// Рубли прописью (без копеек): 240000 → «двести сорок тысяч рублей».
function rubWords(n: number): string {
  if (n === 0) return "ноль рублей";
  const th = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (th) {
    parts.push(triple(th, true));
    parts.push(plural(th, "тысяча", "тысячи", "тысяч"));
  }
  if (rest) parts.push(triple(rest, false));
  parts.push(plural(n, "рубль", "рубля", "рублей"));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

// Число прописью в родительном падеже для «в течение N (…) недель».
// Частые значения — точным словом; иначе падаем на цифру.
const WEEKS_GEN: Record<number, string> = {
  24: "двадцати четырёх",
  26: "двадцати шести",
  40: "сорока",
};
function weeksGen(n: number): string {
  return WEEKS_GEN[n] ?? String(n);
}

// --- helpers ----------------------------------------------------------

function para(text: string, opts: { bold?: boolean; center?: boolean; size?: number; after?: number } = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { after: opts.after ?? 120 },
    children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? 22 })],
  });
}

// мелкая серая подпись поля (под значением)
function caption(text: string) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 16, italics: true, color: "777777" })],
  });
}

function heading(text: string) {
  return new Paragraph({
    spacing: { before: 180, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22 })],
  });
}

function cell(text: string, opts: { bold?: boolean; caption?: boolean } = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: opts.bold,
            size: opts.caption ? 16 : 22,
            italics: opts.caption,
            color: opts.caption ? "777777" : undefined,
          }),
        ],
      }),
    ],
  });
}

// Фиксированная сетка колонок (в твипах) обязательна — иначе Pages/Word
// схлопывают колонки до 1 символа в ширину. Сумма ≈ ширина текста на A4.
function fullTable(rows: TableRow[], columnWidths: number[]) {
  return new Table({
    width: { size: columnWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    rows,
  });
}

function tenantLine(t: ContractTenant): string {
  const parts: string[] = [t.fio];
  if (t.birthDate) parts.push(`${t.birthDate} г.р.`);
  if (t.birthPlace) parts.push(`место рождения: ${t.birthPlace}`);
  const sn = [t.passportSeries, t.passportNumber].filter(Boolean).join(" № ");
  if (sn) parts.push(`паспорт ${sn}`);
  if (t.issuedBy || t.issueDate)
    parts.push(`выдан ${[t.issueDate, t.issuedBy].filter(Boolean).join(" ")}`.trim());
  if (t.departmentCode) parts.push(`код подразделения ${t.departmentCode}`);
  parts.push(`адрес рег.: ${t.regAddress?.trim() || FILL}`);
  parts.push(`адрес факт.: ${t.factAddress?.trim() || FILL}`);
  if (t.phone) parts.push(`тел. ${t.phone}`);
  if (t.telegram) parts.push(`Telegram: @${t.telegram.replace(/^@/, "")}`);
  return parts.join(", ");
}

// Строка оценочной стоимости (п. 1.3): велосипед + N×АКБ + ЗУ + ключи + короб.
function valuationLine(bike: ContractBike): { text: string; total: number } {
  const v = bike.valuation;
  const items: string[] = [`велосипед ${bike.model} — ${rub.format(v.bike)} ₽`];
  for (let i = 0; i < bike.batteryCount; i++) {
    items.push(`аккумулятор ${bike.batteryParams} — ${rub.format(v.batteryEach)} ₽`);
  }
  items.push(`зарядное устройство — ${rub.format(v.charger)} ₽`);
  items.push(`ключи и замок — ${rub.format(v.keysLock)} ₽`);
  items.push(`короб (кофр) — ${rub.format(v.box)} ₽`);
  const total = v.bike + v.batteryEach * bike.batteryCount + v.charger + v.keysLock + v.box;
  return { text: `1.3. Оценочная стоимость Имущества: ${items.join(", ")}, итого ${rub.format(total)} ₽.`, total };
}

// --- generator --------------------------------------------------------

export async function generateContractBlob(data: ContractData): Promise<Blob> {
  const t = data.tenant;
  const b = data.kind === "выкуп"; // выкуп vs аренда
  const bike = data.bike;
  const val = valuationLine(bike);
  const valTotal = val.total;

  // Экономика выкупа/аренды.
  const buyoutWeekly = data.buyout?.weekly ?? 0;
  const buyoutWeeks = data.buyout?.weeks ?? 0;
  const buyoutTotal = buyoutWeekly * buyoutWeeks;
  const rentWeekly = data.rent?.weekly ?? 0;
  const deposit = data.rent?.deposit ?? 5000;

  const batteryTableLine = `${bike.batteryCount} шт.: ${bike.batteryParams}`;

  const children = [
    para(
      b
        ? "ДОГОВОР АРЕНДЫ ЭЛЕКТРОВЕЛОСИПЕДА С ПРАВОМ ВЫКУПА"
        : "ДОГОВОР АРЕНДЫ ЭЛЕКТРОВЕЛОСИПЕДА",
      { bold: true, center: true, size: 26, after: 160 },
    ),

    // Шапка: город / дата / номер
    fullTable(
      [
        new TableRow({
          children: [
            cell("г. Санкт-Петербург"),
            cell(data.dateText),
            cell(`№ ${data.number}`, { bold: true }),
          ],
        }),
        new TableRow({
          children: [
            cell("Город составления", { caption: true }),
            cell("Дата составления", { caption: true }),
            cell("Номер договора", { caption: true }),
          ],
        }),
      ],
      [3600, 3000, 2400],
    ),

    para(
      "Семенов Евгений Ильич, паспорт 47 18 № 648777, выдан УМВД России по Мурманской области 11.04.2019, код 510-004, адрес рег.: Мурманская обл., г. Кировск, тел. +7 (901) 300-03-19",
      { after: 40 },
    ),
    caption(
      "ФИО арендодателя, паспорт, кем и когда выдан, код подразделения, адрес регистрации — именуемый «Арендодатель»",
    ),

    para(tenantLine(t), { after: 40 }),
    caption(
      "ФИО арендатора, дата рождения, паспорт, кем и когда выдан, код подразделения, адрес регистрации и фактического проживания — именуемый «Арендатор», совместно «Стороны»",
    ),

    heading("1. Предмет договора"),
    para(
      b
        ? "1.1. Арендодатель передаёт Арендатору во временное возмездное владение и пользование электровелосипед (далее — «Имущество») с правом последующего выкупа, а Арендатор обязуется вносить платежи согласно разделу 2."
        : "1.1. Арендодатель передаёт Арендатору во временное возмездное владение и пользование электровелосипед (далее — «Имущество»), а Арендатор обязуется вносить арендную плату согласно разделу 2. Право собственности на Имущество остаётся у Арендодателя; выкуп Имущества настоящим договором не предусмотрен.",
    ),

    // Характеристики Имущества
    fullTable(
      [
        new TableRow({ children: [cell(bike.model, { bold: true }), cell("Марка/модель", { caption: true })] }),
        new TableRow({ children: [cell("чёрный с зелёными деталями"), cell("Цвет", { caption: true })] }),
        new TableRow({ children: [cell("2026"), cell("Год выпуска", { caption: true })] }),
        new TableRow({ children: [cell(""), cell("VIN / номер рамы (вписывается при передаче)", { caption: true })] }),
        new TableRow({ children: [cell("25 км/ч"), cell("Ограничитель скорости", { caption: true })] }),
        new TableRow({ children: [cell(batteryTableLine), cell("Аккумуляторная батарея (передаётся)", { caption: true })] }),
      ],
      [4600, 4400],
    ),

    para(
      "1.2. При передаче Имущества Стороны производят фото- и видеофиксацию его состояния и комплектации (не менее 10 фото и видео не менее 1 минуты).",
    ),
    para(val.text),

    heading(b ? "2. Выкупная цена и порядок расчётов" : "2. Арендная плата, залог и срок"),
    ...(b
      ? [
          para(
            `2.1. Выкупная цена Имущества составляет ${rub.format(buyoutTotal)} ₽ (${rubWords(buyoutTotal)}) и уплачивается еженедельными платежами по ${rub.format(buyoutWeekly)} ₽ в течение ${buyoutWeeks} (${weeksGen(buyoutWeeks)}) недель.`,
          ),
          para(
            "2.2. Платёж вносится авансом не позднее 17:00 первого дня недельного периода наличными или переводом на счёт/карту Арендодателя; подтверждение — чек, расписка или электронная квитанция.",
          ),
          para(
            `2.3. Право собственности переходит к Арендатору после внесения выкупной цены в полном объёме (всех ${buyoutWeeks} платежей) и оформляется отдельным актом. К выкупу применяются правила о купле-продаже (п. 3 ст. 609, ст. 624 ГК РФ).`,
          ),
          para(
            "2.4. До перехода права собственности Арендатор не вправе отчуждать, закладывать или передавать Имущество третьим лицам.",
          ),
        ]
      : [
          para(
            `2.1. Арендная плата составляет ${rub.format(rentWeekly)} ₽ в неделю. Платёж вносится авансом не позднее 17:00 первого дня недельного периода наличными или переводом на счёт/карту Арендодателя; подтверждение — чек, расписка или электронная квитанция.`,
          ),
          para(
            `2.2. При заключении договора Арендатор вносит обеспечительный залог в размере ${rub.format(deposit)} ₽. Залог возвращается Арендатору при возврате Имущества за вычетом задолженности по арендной плате, штрафов и подтверждённого ущерба.`,
          ),
          para(
            "2.3. Договор заключён на неопределённый срок и вступает в силу с момента подписания. Любая Сторона вправе расторгнуть договор в одностороннем порядке, письменно (в т. ч. через мессенджер/SMS) уведомив другую Сторону не менее чем за 3 дня; Имущество подлежит возврату не позднее дня расторжения.",
          ),
          para("2.4. Арендатор не вправе отчуждать, закладывать или передавать Имущество третьим лицам."),
        ]),

    heading("3. Обязанности Арендатора и ограничения"),
    para(
      b
        ? "3.1. Хранить Имущество только в закрытом помещении; хранение на улице ночью (22:00–08:00) запрещено. Ущерб от ненадлежащего хранения возмещается в размере 100%."
        : "3.1. Имущество хранится в закрытом помещении. Допускается хранение на улице, в том числе ночью (22:00–08:00), при одновременном соблюдении следующих мер: использование защитного чехла/тента, исправного замка с пристёгиванием к стационарному объекту (велопарковка, ограждение и т. п.), а также при отсутствии явной угрозы хищения или повреждения. При несоблюдении указанных мер ущерб от хищения, повреждения или утраты возмещается в размере 100%.",
    ),
    para(
      "3.2. Запрещены: субаренда и передача третьим лицам, использование в качестве такси, вывоз за пределы СПб и Лен. обл. без письменного согласия Арендодателя — штраф 30 000 ₽.",
    ),
    para(
      "3.3. Снятие или модификация ограничителя скорости запрещены — штраф 15 000 ₽; ответственность за последствия превышения скорости несёт Арендатор.",
    ),
    para(
      "3.4. Управление в состоянии опьянения запрещено; весь ущерб при таком использовании возмещается в размере 100%. Арендатор подтверждает наличие необходимых документов и несёт ответственность за нарушения ПДД и вред третьим лицам.",
    ),
    para(
      "3.5. Уступка прав и перевод долга без письменного согласия Арендодателя не допускаются — штраф 30 000 ₽. Самостоятельный ремонт и разборка без его согласия запрещены — штраф 15 000 ₽.",
    ),

    heading("4. Ответственность сторон"),
    para(
      "4.1. При непоступлении платежа в срок Арендодатель вправе расторгнуть договор в одностороннем порядке (ст. 450.1 ГК РФ); Арендатор возвращает Имущество в течение 24 часов с момента требования. При 2 и более просрочках — расторжение и изъятие Имущества.",
    ),
    para("4.2. За просрочку возврата — 2 000 ₽/день; сервисный сбор за выезд при невозврате — 2 500 ₽."),
    para(
      b
        ? "4.3. При расторжении до завершения выкупа Имущество возвращается Арендодателю; внесённые платежи возвращаются за вычетом платы за фактический период пользования, задолженности и подтверждённого ущерба в течение 10 рабочих дней."
        : "4.3. При расторжении Имущество возвращается Арендодателю; залог возвращается Арендатору в течение 10 рабочих дней за вычетом задолженности, штрафов и подтверждённого ущерба.",
    ),
    para(
      `4.4. При утрате, хищении, уничтожении или конфискации Имущества Арендатор возмещает его полную оценочную стоимость (${rub.format(valTotal)} ₽ либо стоимость утраченных компонентов). При хищении — заявление в полицию в течение 24 часов и уведомление Арендодателя.`,
    ),
    para(
      "4.5. Плановое ТО (естественный износ) — поровну (50/50); ремонт по вине Арендатора — 100% за его счёт. Повреждения, не зафиксированные при передаче, считаются возникшими по вине Арендатора, пока не доказано иное.",
    ),

    heading("5. Прочие условия"),
    para(
      "5.1. Уведомления направляются по указанным телефонам (звонок, SMS, мессенджер); об изменении контактов сообщить в течение 1 дня. Договор составлен в двух экземплярах равной силы. Изменения — письменно за подписью обеих Сторон. Споры — в суде по правилам подсудности (по месту жительства ответчика).",
    ),

    heading("Подписи сторон"),
    fullTable(
      [
        new TableRow({ children: [cell("АРЕНДОДАТЕЛЬ", { bold: true }), cell("АРЕНДАТОР", { bold: true })] }),
        new TableRow({ children: [cell("Семенов Евгений Ильич"), cell(t.fio)] }),
        new TableRow({ children: [cell("подпись / расшифровка", { caption: true }), cell("подпись / расшифровка", { caption: true })] }),
      ],
      [4500, 4500],
    ),
  ];

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const buf = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buf)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}
