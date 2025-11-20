-- public.todo_tags definition

-- Drop table

-- DROP TABLE public.todo_tags;

CREATE TABLE public.todo_tags (
	todo_id int4 NOT NULL,
	tag_id int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT todo_tags_pkey PRIMARY KEY (todo_id, tag_id),
	CONSTRAINT fk_todo_tags_tag FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE,
	CONSTRAINT fk_todo_tags_todo FOREIGN KEY (todo_id) REFERENCES public.todos(id) ON DELETE CASCADE
);
CREATE INDEX idx_todo_tags_tag_id ON public.todo_tags USING btree (tag_id);