-- Restore your specific user data to seven_strata table
-- This will fetch your user_id and company_id from employees table and create the record

-- First, let's see your current employee data
SELECT 
    e.user_id,
    e.company_id,
    c.name as company_name,
    e.first_name,
    e.last_name,
    e.email
FROM employees e
INNER JOIN companies c ON e.company_id = c.id
WHERE e.user_id = 'cdaf1112-a685-42ca-87b2-9f24aea2213f';

-- Insert your data back into seven_strata table
INSERT INTO seven_strata (
    user_id, 
    company_id, 
    company_name,
    words_you_own,
    sandbox_brand_promises,
    brand_promise_guarantee,
    one_phrase_strategy,
    differentiating_activities,
    x_factor,
    profit_bhag,
    created_at,
    updated_at
)
SELECT 
    e.user_id,
    e.company_id,
    c.name as company_name,
    '[]'::jsonb as words_you_own,
    '{"core_customers": [], "products_services": [], "brand_promises": [], "kpis": []}'::jsonb as sandbox_brand_promises,
    '' as brand_promise_guarantee,
    '' as one_phrase_strategy,
    '[]'::jsonb as differentiating_activities,
    '' as x_factor,
    '{"profit_per_x": [], "bhag": []}'::jsonb as profit_bhag,
    NOW() as created_at,
    NOW() as updated_at
FROM employees e
INNER JOIN companies c ON e.company_id = c.id
WHERE e.user_id = 'cdaf1112-a685-42ca-87b2-9f24aea2213f'
  AND e.is_employed = true
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Verify the insert worked
SELECT 
    user_id, 
    company_id, 
    company_name,
    created_at,
    words_you_own,
    profit_bhag
FROM seven_strata 
WHERE user_id = 'cdaf1112-a685-42ca-87b2-9f24aea2213f';