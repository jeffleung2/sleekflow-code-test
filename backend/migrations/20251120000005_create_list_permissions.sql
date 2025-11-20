-- public.list_permissions definition

-- Drop table

-- DROP TABLE public.list_permissions;

CREATE TABLE public.list_permissions (
	id serial4 NOT NULL,
	list_id int4 NOT NULL,
	user_id int4 NOT NULL,
	permission_level varchar(20) DEFAULT 'view'::character varying NOT NULL,
	shared_by int4 NOT NULL,
	shared_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT list_permissions_pkey PRIMARY KEY (id),
	CONSTRAINT unique_list_user_permission UNIQUE (list_id, user_id),
	CONSTRAINT valid_permission_level CHECK (((permission_level)::text = ANY ((ARRAY['view'::character varying, 'update'::character varying])::text[]))),
	CONSTRAINT fk_list_permissions_list FOREIGN KEY (list_id) REFERENCES public.todo_lists(id) ON DELETE CASCADE,
	CONSTRAINT fk_list_permissions_shared_by FOREIGN KEY (shared_by) REFERENCES public.users(id) ON DELETE CASCADE,
	CONSTRAINT fk_list_permissions_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_list_permissions_level ON public.list_permissions USING btree (permission_level);
CREATE INDEX idx_list_permissions_list_id ON public.list_permissions USING btree (list_id);
CREATE INDEX idx_list_permissions_user_id ON public.list_permissions USING btree (user_id);