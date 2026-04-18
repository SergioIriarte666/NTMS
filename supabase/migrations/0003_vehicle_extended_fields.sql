alter table public.vehicles
add column if not exists empresa_rut text,
add column if not exists empresa_razon_social text,
add column if not exists marca text,
add column if not exists modelo text,
add column if not exists categoria_peaje text,
add column if not exists venc_permiso_circulacion date,
add column if not exists venc_seguro date,
add column if not exists venc_revision_tecnica date;

