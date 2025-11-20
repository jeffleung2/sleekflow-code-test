-- public.todo_lists definition

-- Drop table

-- DROP TABLE public.todo_lists;

CREATE TABLE public.todo_lists (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	owner_id int4 NOT NULL,
	color varchar(7) DEFAULT '#3B82F6'::character varying NULL,
	is_archived bool DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	CONSTRAINT todo_lists_pkey PRIMARY KEY (id),
	CONSTRAINT fk_todo_lists_owner FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_todo_lists_is_archived ON public.todo_lists USING btree (is_archived);
CREATE INDEX idx_todo_lists_owner_id ON public.todo_lists USING btree (owner_id);
