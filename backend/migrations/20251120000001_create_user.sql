-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	id serial4 NOT NULL,
	email varchar(255) NOT NULL,
	username varchar(100) NOT NULL,
	password_hash varchar(255) NOT NULL,
	full_name varchar(255) NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	CONSTRAINT users_email_key UNIQUE (email),
	CONSTRAINT users_pkey PRIMARY KEY (id),
	CONSTRAINT users_username_key UNIQUE (username),
	CONSTRAINT valid_email CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))
);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);
CREATE INDEX idx_users_username ON public.users USING btree (username);

