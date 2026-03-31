/*
  # Create BRAVA Financial Statements Document Schema

  1. New Tables
    - `documents`
      - `id` (uuid, primary key) - Unique document identifier
      - `user_id` (uuid, references auth.users) - Document owner
      - `title` (text) - Document title
      - `entity_id` (text) - Associated entity identifier
      - `financial_year` (text) - Financial year (e.g., "2025")
      - `currency` (text, default 'EUR') - Document currency
      - `language` (text, default 'en') - Document language
      - `content` (jsonb) - Full document model as JSON
      - `status` (text, default 'draft') - Document lifecycle status
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `document_versions`
      - `id` (uuid, primary key) - Version identifier
      - `document_id` (uuid, references documents) - Parent document
      - `version_number` (integer) - Incrementing version number
      - `content` (jsonb) - Document snapshot at this version
      - `change_summary` (text) - Description of changes
      - `created_by` (uuid, references auth.users) - Who saved this version
      - `created_at` (timestamptz) - When this version was saved

    - `trial_balances`
      - `id` (uuid, primary key) - Trial balance identifier
      - `user_id` (uuid, references auth.users) - Owner
      - `entity_id` (text) - Associated entity
      - `financial_year` (text) - Financial year
      - `name` (text) - TB name/label
      - `data` (jsonb) - Trial balance line items as JSON
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `entities`
      - `id` (uuid, primary key) - Entity identifier
      - `user_id` (uuid, references auth.users) - Owner
      - `name` (text) - Entity name
      - `legal_form` (text) - Legal form (e.g., S.a r.l., S.A.)
      - `rcs_number` (text) - Luxembourg RCS number
      - `address` (text) - Registered address
      - `metadata` (jsonb) - Additional entity data
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own documents, trial balances, and entities
    - Separate SELECT, INSERT, UPDATE, DELETE policies

  3. Indexes
    - documents: user_id, entity_id, financial_year
    - document_versions: document_id
    - trial_balances: user_id, entity_id
    - entities: user_id
*/

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL DEFAULT '',
  entity_id text NOT NULL DEFAULT '',
  financial_year text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'EUR',
  language text NOT NULL DEFAULT 'en',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity_id ON documents(entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_financial_year ON documents(financial_year);

-- Document versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  change_summary text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of own documents"
  ON document_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_versions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions of own documents"
  ON document_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_versions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete versions of own documents"
  ON document_versions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_versions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);

-- Trial balances table
CREATE TABLE IF NOT EXISTS trial_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  entity_id text NOT NULL DEFAULT '',
  financial_year text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trial_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trial balances"
  ON trial_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trial balances"
  ON trial_balances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trial balances"
  ON trial_balances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trial balances"
  ON trial_balances FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trial_balances_user_id ON trial_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_balances_entity_id ON trial_balances(entity_id);

-- Entities table
CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL DEFAULT '',
  legal_form text NOT NULL DEFAULT '',
  rcs_number text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entities"
  ON entities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own entities"
  ON entities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entities"
  ON entities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entities"
  ON entities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_entities_user_id ON entities(user_id);
