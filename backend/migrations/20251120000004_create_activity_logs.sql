-- public.activity_logs definition

-- Drop table

-- DROP TABLE public.activity_logs;

CREATE TABLE public.activity_logs (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	list_id int4 NULL,
	todo_id int4 NULL,
	action_type varchar(50) NOT NULL,
	entity_type varchar(50) NOT NULL,
	entity_id int4 NULL,
	details jsonb NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
	CONSTRAINT activity_logs_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.todo_lists(id) ON DELETE CASCADE,
	CONSTRAINT activity_logs_todo_id_fkey FOREIGN KEY (todo_id) REFERENCES public.todos(id) ON DELETE SET NULL,
	CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs USING btree (action_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at DESC);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs USING btree (entity_type);
CREATE INDEX idx_activity_logs_list_id ON public.activity_logs USING btree (list_id);
CREATE INDEX idx_activity_logs_todo_id ON public.activity_logs USING btree (todo_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);