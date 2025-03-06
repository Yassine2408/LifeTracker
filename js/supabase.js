// Create a self-executing function to avoid global scope pollution
(function() {
    // Load Supabase from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/umd/supabase.min.js';
    script.async = true;
    
    script.onload = function() {
        // Initialize Supabase client
        const supabaseUrl = 'https://vwhzvnwoimhdqglzzach.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3aHp2bndvaW1oZHFnbHp6YWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyODE4MTEsImV4cCI6MjA1Njg1NzgxMX0.gT9JWubVNKZ3EkGDBAvQcTGLFEmBpmhlIpbdSBNxjck';
        
        // Create the Supabase client
        window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
        
        // Define all functions in the global scope
        window.checkUser = async function() {
            const { data: { user } } = await window.supabase.auth.getUser();
            return user;
        };
        
        window.signUp = async function(email, password, fullName) {
            try {
                const { data, error } = await window.supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                });
                
                if (error) throw error;
                
                return { success: true, data };
            } catch (error) {
                console.error('Error signing up:', error.message);
                return { success: false, error: error.message };
            }
        };
        
        window.signIn = async function(email, password) {
            try {
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) throw error;
                
                return { success: true, data };
            } catch (error) {
                console.error('Error signing in:', error.message);
                return { success: false, error: error.message };
            }
        };
        
        window.signOut = async function() {
            try {
                const { error } = await window.supabase.auth.signOut();
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('Error signing out:', error.message);
                return { success: false, error: error.message };
            }
        };
        
        window.saveData = async function(table, data, userId) {
            try {
                // Add user_id to data
                data.user_id = userId;
                
                const { data: result, error } = await window.supabase
                    .from(table)
                    .upsert(data)
                    .select();
                    
                if (error) throw error;
                
                return { success: true, data: result };
            } catch (error) {
                console.error(`Error saving data to ${table}:`, error.message);
                return { success: false, error: error.message };
            }
        };
        
        window.loadData = async function(table, userId) {
            try {
                const { data, error } = await window.supabase
                    .from(table)
                    .select('*')
                    .eq('user_id', userId);
                    
                if (error) throw error;
                
                return { success: true, data };
            } catch (error) {
                console.error(`Error loading data from ${table}:`, error.message);
                return { success: false, error: error.message };
            }
        };
        
        window.deleteData = async function(table, id, userId) {
            try {
                const { data, error } = await window.supabase
                    .from(table)
                    .delete()
                    .eq('id', id)
                    .eq('user_id', userId);
                    
                if (error) throw error;
                
                return { success: true };
            } catch (error) {
                console.error(`Error deleting data from ${table}:`, error.message);
                return { success: false, error: error.message };
            }
        };
        
        // Dispatch an event when Supabase is ready
        document.dispatchEvent(new Event('supabaseReady'));
    };
    
    document.head.appendChild(script);
})();

// Export all functions and the supabase client
export {
    supabase,
    checkUser,
    signUp,
    signIn,
    signOut,
    saveData,
    loadData,
    deleteData
}; 

// Example import in another file
import { supabase, checkUser, signIn, signUp } from './js/supabase.js';