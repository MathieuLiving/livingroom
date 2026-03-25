-- Create agency_invitations table
CREATE TABLE IF NOT EXISTS public.agency_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent', -- 'agent' or 'team_leader'
    temporary_code TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    inviter_id UUID REFERENCES public.professionnels(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agency_invitations_token ON public.agency_invitations(token);
CREATE INDEX IF NOT EXISTS idx_agency_invitations_email ON public.agency_invitations(email);

-- RLS Policies
ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;

-- Directors and Team Leaders can view invitations they created or for their agency
CREATE POLICY "View agency invitations" ON public.agency_invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.professionnels p
            WHERE p.user_id = auth.uid()
            AND p.agency_id = agency_invitations.agency_id
            AND (p.agency_role = 'director' OR p.agency_role = 'team_leader')
        )
    );

-- Allow public access for verification (by token) via RPC only usually, but for direct select need token match
CREATE POLICY "Verify invitation public" ON public.agency_invitations
    FOR SELECT
    USING (true); 

-- RPC: Generate Invitation
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS TEXT
LANGUAGE sql
AS $$
    -- Simple 6 digit code
    SELECT floor(random() * (999999 - 100000 + 1) + 100000)::text;
$$;

-- RPC: Verify Invitation
CREATE OR REPLACE FUNCTION public.verify_invitation_code(
    p_token TEXT,
    p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation public.agency_invitations;
BEGIN
    SELECT * INTO v_invitation
    FROM public.agency_invitations
    WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invitation invalide ou expirée.');
    END IF;

    IF v_invitation.temporary_code !== p_code THEN
        RETURN jsonb_build_object('success', false, 'message', 'Code temporaire incorrect.');
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'email', v_invitation.email, 
        'agency_id', v_invitation.agency_id,
        'role', v_invitation.role
    );
END;
$$;

-- RPC: Mark Accepted
CREATE OR REPLACE FUNCTION public.mark_invitation_accepted(
    p_token TEXT,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.agency_invitations
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        user_id = p_user_id
    WHERE token = p_token;
    
    RETURN FOUND;
END;
$$;