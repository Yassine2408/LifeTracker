// Import the Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/+esm';

// supabase.js - Handles Supabase integration and authentication

// Initialize Supabase client
const supabaseUrl = 'https://vwhzvnwoimhdqglzzach.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3aHp2bndvaW1oZHFnbHp6YWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyODE4MTEsImV4cCI6MjA1Njg1NzgxMX0.gT9JWubVNKZ3EkGDBAvQcTGLFEmBpmhlIpbdSBNxjck';
const supabase = createClient(supabaseUrl, supabaseKey);

// Check if user is logged in
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Sign up a new user
async function signUp(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
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
}

// Sign in an existing user
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('Error signing in:', error.message);
        return { success: false, error: error.message };
    }
}

// Sign out the current user
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error signing out:', error.message);
        return { success: false, error: error.message };
    }
}

// Save data to Supabase
async function saveData(table, data, userId) {
    try {
        // Add user_id to data
        data.user_id = userId;
        
        const { data: result, error } = await supabase
            .from(table)
            .upsert(data)
            .select();
            
        if (error) throw error;
        
        return { success: true, data: result };
    } catch (error) {
        console.error(`Error saving data to ${table}:`, error.message);
        return { success: false, error: error.message };
    }
}

// Load data from Supabase
async function loadData(table, userId) {
    try {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', userId);
            
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error(`Error loading data from ${table}:`, error.message);
        return { success: false, error: error.message };
    }
}

// Delete data from Supabase
async function deleteData(table, id, userId) {
    try {
        const { data, error } = await supabase
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
}

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