-- Fase 1: bandeja "por revisar" y categorías con emoji (estilo Copilot).

alter table public.transactions
  add column revisado boolean not null default true;

create index transactions_por_revisar_idx on public.transactions (user_id)
  where not revisado;

-- Emoji por categoría (la columna icono pasa a guardar un emoji editable).
update public.categories c set icono = e.emoji
from (values
  ('Casa', '🏠'), ('Hijos', '🧒'), ('Personal', '🙋'), ('Suscripciones', '🔁'),
  ('Deudas y ahorro', '⚖️'), ('Lemon', '🍋'), ('Freelance', '💻'), ('Otros', '📦'), ('Ingresos', '💰'),
  ('Cuota apartamento', '🏢'), ('Mercado', '🛒'), ('Acueducto', '💧'), ('Gas natural', '🔥'),
  ('Luz', '💡'), ('Internet', '📶'), ('Hogar varios', '🛋️'),
  ('Pensión colegio Matías', '🏫'), ('Ruta escolar Matías', '🚌'), ('Pañales', '👶'),
  ('Ropa hijo menor', '🧸'), ('Hijos varios', '🎈'),
  ('Sura plan complementario', '🩺'), ('Celular Claro', '📱'), ('Milo', '🐶'), ('Restaurantes', '🍽️'),
  ('Transporte', '🚕'), ('Salud', '💊'), ('Ropa', '👕'), ('Entretenimiento', '🎬'), ('Personal varios', '✨'),
  ('Netflix', '📺'), ('Spotify', '🎧'), ('DataCrédito', '📊'), ('Google One', '☁️'), ('iCloud', '🍏'),
  ('YouTube Premium', '▶️'),
  ('Sandra Ballesteros', '🤝'), ('Martha Sánchez', '🤝'), ('Giovanni García', '🤝'), ('Cadena (ahorro)', '🐷'),
  ('Intereses y cuotas de manejo', '🏦'),
  ('Meta – bots de WhatsApp', '🤖'), ('Otros gastos Lemon', '🍋'),
  ('Herramientas freelance', '🛠️'), ('Otros gastos freelance', '💼'),
  ('Regalos', '🎁'), ('Imprevistos', '⚠️'), ('Otros', '📦'),
  ('Sueldo Lemon', '💼'), ('Freelance', '💻'), ('Reembolso Lemon', '↩️'), ('Otros ingresos', '➕')
) as e(nombre, emoji)
where c.nombre = e.nombre;
