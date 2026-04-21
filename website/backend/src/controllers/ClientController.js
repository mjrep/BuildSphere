const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

class ClientController {
  static async index(req, res) {
    if (!supabase) return res.status(500).json({ message: 'Supabase client not initialized' });

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('company_name', { ascending: true });

      if (error) throw error;

      res.json({ data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching clients', error: err.message });
    }
  }

  static async store(req, res) {
    if (!supabase) return res.status(500).json({ message: 'Supabase client not initialized' });

    try {
      const { company_name, contact_person, contact_number, email, address } = req.body;

      if (!company_name) {
        return res.status(422).json({
          message: 'The company name field is required.',
          errors: { company_name: ['The company name field is required.'] }
        });
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([{
          company_name,
          contact_person,
          contact_number,
          email,
          address
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error creating client', error: err.message });
    }
  }
}

module.exports = ClientController;
