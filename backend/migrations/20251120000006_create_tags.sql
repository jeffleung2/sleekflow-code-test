-- public.tags definition

-- Drop table

-- DROP TABLE public.tags;

CREATE TABLE public.tags (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	color varchar(7) DEFAULT '#6B7280'::character varying NULL,
	user_id int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT tags_pkey PRIMARY KEY (id),
	CONSTRAINT unique_user_tag_name UNIQUE (user_id, name)
);
CREATE INDEX idx_tags_name ON public.tags USING btree (name);
CREATE INDEX idx_tags_user_id ON public.tags USING btree (user_id);


-- public.tags foreign keys

ALTER TABLE public.tags ADD CONSTRAINT fk_tags_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;