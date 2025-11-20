-- public.todos definition

-- Drop table

-- DROP TABLE public.todos;

CREATE TABLE public.todos (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	due_date date NOT NULL,
	status varchar(50) DEFAULT 'Not Started'::character varying NOT NULL,
	priority varchar(20) DEFAULT 'Medium'::character varying NOT NULL,
	list_id int4 NOT NULL,
	created_by int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	completed_at timestamptz NULL,
	CONSTRAINT todos_pkey PRIMARY KEY (id),
	CONSTRAINT valid_priority CHECK (((priority)::text = ANY ((ARRAY['Highest'::character varying, 'High'::character varying, 'Medium'::character varying, 'Low'::character varying, 'Lowest'::character varying])::text[]))),
	CONSTRAINT valid_status CHECK (((status)::text = ANY ((ARRAY['Not Started'::character varying, 'In Progress'::character varying, 'Completed'::character varying])::text[]))),
	CONSTRAINT fk_todos_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE,
	CONSTRAINT fk_todos_list FOREIGN KEY (list_id) REFERENCES public.todo_lists(id) ON DELETE CASCADE
);
CREATE INDEX idx_todos_completed_at ON public.todos USING btree (completed_at);
CREATE INDEX idx_todos_created_by ON public.todos USING btree (created_by);
CREATE INDEX idx_todos_due_date ON public.todos USING btree (due_date);
CREATE INDEX idx_todos_list_id ON public.todos USING btree (list_id);
CREATE INDEX idx_todos_priority ON public.todos USING btree (priority);
CREATE INDEX idx_todos_status ON public.todos USING btree (status);

-- Table Triggers

create trigger set_todos_completed_at before
update
    on
    public.todos for each row execute function set_completed_at();