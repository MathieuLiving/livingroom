-- Add free customization flags to agencies
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS free_customization_colors BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS free_customization_logo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS free_customization_video BOOLEAN DEFAULT TRUE;

-- Drop old enforce columns if they exist (migration safety)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'enforce_brand_colors') THEN
        ALTER TABLE public.agencies DROP COLUMN enforce_brand_colors;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'enforce_logo') THEN
        ALTER TABLE public.agencies DROP COLUMN enforce_logo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'enforce_video') THEN
        ALTER TABLE public.agencies DROP COLUMN enforce_video;
    END IF;
END $$;

-- Update Guard Function
CREATE OR REPLACE FUNCTION public.guard_pro_cards_colors_for_agency()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  v_agency_id uuid;
  v_free_customization boolean;
  v_role public.agency_role_enum;
  v_uniform boolean;
  colors_changed boolean;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  colors_changed :=
    (new.card_banner_color is distinct from old.card_banner_color) or
    (new.card_text_color is distinct from old.card_text_color) or
    (new.card_primary_button_color is distinct from old.card_primary_button_color) or
    (new.card_secondary_button_color is distinct from old.card_secondary_button_color) or
    (new.card_qr_fg_color is distinct from old.card_qr_fg_color) or
    (new.card_name_color is distinct from old.card_name_color) or
    (new.card_signature_color is distinct from old.card_signature_color) or
    (new.card_company_name_color is distinct from old.card_company_name_color) or
    (new.card_support_text_color is distinct from old.card_support_text_color);

  if not colors_changed then
    return new;
  end if;

  select
    p.agency_id,
    coalesce(p.agency_role, 'agent'::public.agency_role_enum),
    coalesce(a.colors_uniform, false),
    coalesce(a.free_customization_colors, true)
  into v_agency_id, v_role, v_uniform, v_free_customization
  from public.professionnels p
  left join public.agencies a on a.id = p.agency_id
  where p.id = new.professionnel_id;

  if not found then
    return new;
  end if;

  -- ✅ indépendant : autorisé
  if v_agency_id is null then
    return new;
  end if;

  -- ✅ Directeur : TOUJOURS autorisé à modifier sa propre carte
  if v_role = 'director'::public.agency_role_enum then
    return new;
  end if;

  -- ✅ Agent/Team Leader : autorisé seulement si free_customization_colors = true
  if v_free_customization then
    return new;
  end if;

  raise exception 'Configuration définie par le directeur.';
end;
$function$;