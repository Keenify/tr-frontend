import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TextField,
  Typography,
  Box,
  Button,
  IconButton,
  Grid,
  CircularProgress,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CashConversionCycleImage from '../../../assets/home/cash_conversion_cycle_upscale.png';
import CashConversionMap from './CashConversionMap';
import { useCashStrategies } from '../hooks/useCashStrategies';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData'; // Import the hook
import toast, { Toaster } from 'react-hot-toast'; // Import toast
import { CashAccelerationStrategies as StrategiesType, StrategyItem } from '../types/cashAcceleration'; // Import types
import { Session } from '@supabase/supabase-js'; // Import Session type

// Define props for the component, including session
interface CashAccelerationStrategiesProps {
  session: Session; // Changed to require Session (non-nullable)
}

// Helper to create a new empty StrategyItem for adding
const createEmptyStrategyItem = (): StrategyItem => ({
    strategy: '',
    shorten_cycle_times: false,
    eliminate_mistakes: false,
    improve_business_model_pnl: false,
});

const CashAccelerationStrategies: React.FC<CashAccelerationStrategiesProps> = ({ session }) => {
  // --- Call Hooks Unconditionally --- 
  console.log('session', session);


  // Use optional chaining for safety when accessing user ID
  const { companyInfo, isLoading: isLoadingCompany } = useUserAndCompanyData(session?.user?.id);
  const companyId = companyInfo?.id;

  // This hook already handles null/undefined companyId
  const { strategies, setStrategies: setApiStrategies, loading, error, updateStrategies, refetch } = useCashStrategies(companyId);

  // Local state for UI control
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // --- Browser-level Navigation Prompt ---
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isEditing && isDirty) {
        const message = "You have unsaved changes. Are you sure you want to leave?";
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, isEditing]);
  // --- End Browser-level Prompt Logic ---

  // Map section keys to titles for rendering
  const sectionDetails: Record<keyof StrategiesType, { title: string; letter: string }> = {
    sales_cycle_improvement: { title: 'Ways to improve your Sales Cycle', letter: 'A' },
    make_production_inventory_improvement: { title: 'Ways to improve your Make/Production & Inventory Cycle', letter: 'B' },
    delivery_cycle_improvement: { title: 'Ways to improve your Delivery Cycle', letter: 'C' },
    billing_payment_cycle_improvement: { title: 'Ways to improve your Billing & Payment Cycle', letter: 'D' },
  };
  const sectionKeys = Object.keys(sectionDetails) as (keyof StrategiesType)[];

  // Refs for input fields to manage focus
  const inputRefs = useRef<Record<string, Record<number, HTMLInputElement | null>>>({});

  // Ensure refs object has keys for each section
  useEffect(() => {
      sectionKeys.forEach(key => {
          if (!inputRefs.current[key]) {
              inputRefs.current[key] = {};
          }
      });
  }, [sectionKeys]);

  // Function to update local state (strategies in the hook's state)
  const updateLocalStrategy = (
    sectionKey: keyof StrategiesType,
    strategyIndex: number,
    field: keyof StrategyItem,
    value: string | boolean
  ) => {
    if (!isEditing || !strategies) return;

    setApiStrategies(prevStrategies => {
        if (!prevStrategies) return null;
        const newStrategies = JSON.parse(JSON.stringify(prevStrategies)) as StrategiesType;
        const section = newStrategies[sectionKey];
        if (section && section[strategyIndex]) {
             const targetStrategy = section[strategyIndex];
             if (field === 'strategy' && typeof value === 'string') {
                 targetStrategy.strategy = value;
             } else if ((field === 'shorten_cycle_times' || field === 'eliminate_mistakes' || field === 'improve_business_model_pnl') && typeof value === 'boolean') {
                 targetStrategy[field] = value;
             }
        }
        return newStrategies;
    });
    setIsDirty(true);
  };

  // Handles description changes - directly updates the local state
  const handleDescriptionChange = (
    sectionKey: keyof StrategiesType,
    strategyIndex: number,
    value: string
  ) => {
    updateLocalStrategy(sectionKey, strategyIndex, 'strategy', value);
  };

  // Handles checkbox state changes - directly updates the local state
  const handleCheckboxChange = (
    sectionKey: keyof StrategiesType,
    strategyIndex: number,
    field: keyof Pick<StrategyItem, 'shorten_cycle_times' | 'eliminate_mistakes' | 'improve_business_model_pnl'>
  ) => {
    if (!isEditing || !strategies) return;
    const currentValue = strategies[sectionKey]?.[strategyIndex]?.[field];
    if (typeof currentValue === 'boolean') {
         updateLocalStrategy(sectionKey, strategyIndex, field, !currentValue);
    }
  };

  // --- Add/Remove Strategy Handlers ---
  const handleAddStrategy = (sectionKey: keyof StrategiesType) => {
      if (!isEditing || !strategies) return;

      setApiStrategies(prevStrategies => {
          if (!prevStrategies) return null;
          const newStrategies = JSON.parse(JSON.stringify(prevStrategies)) as StrategiesType;
          newStrategies[sectionKey].push(createEmptyStrategyItem());
          return newStrategies;
      });
      setIsDirty(true);

      // Focus the new input after state update
      setTimeout(() => {
          const newIndex = strategies ? strategies[sectionKey].length : 0; // Index will be the old length
          inputRefs.current[sectionKey]?.[newIndex]?.focus();
      }, 0);
  };

  const handleRemoveStrategy = (sectionKey: keyof StrategiesType, index: number) => {
      if (!isEditing || !strategies) return;

      setApiStrategies(prevStrategies => {
          if (!prevStrategies) return null;
          const newStrategies = JSON.parse(JSON.stringify(prevStrategies)) as StrategiesType;
          if (newStrategies[sectionKey]?.[index]) {
             newStrategies[sectionKey].splice(index, 1);
          }
          return newStrategies;
      });
      setIsDirty(true);
  };
  // --- End Add/Remove --- 

  // Handle save
  const handleSave = async () => {
    if (!companyId || !isDirty || !isEditing || !strategies) return;

    setIsSaving(true);

    try {
      // The `strategies` state managed by the hook is already up-to-date
      const result = await updateStrategies(strategies);

      if (result.success) {
        toast.success('Changes saved successfully!');
        setIsDirty(false);
        setIsEditing(false); // Exit edit mode after successful save
        // Optional: refetch to ensure data consistency if needed, though updateStrategies should handle it
        // refetch();
      } else {
        toast.error(`Error: ${result.error || 'Failed to save changes'}`);
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Conditional Rendering Logic --- 

  // Check for session validity *after* hooks
  if (!session || !session.user) {
     // Render loading or placeholder while session is resolving
     return (
       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
         <Typography>Loading user session...</Typography>
       </Box>
     );
  }

  // Loading state for company or strategies
   if (isLoadingCompany || (loading && !strategies)) {
     return (
       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
         <Typography>Loading strategy data...</Typography>
         {/* Optionally add a spinner here */}
       </Box>
     );
   }

  // Error state
  if (error) {
    return (
      <Box sx={{ padding: 2 }}>
        <Typography color="error">Error loading strategies: {error}</Typography>
         <Button onClick={refetch} variant="outlined" sx={{ mt: 1 }}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: { xs: 2, md: 4 }, backgroundColor: 'grey.50', minHeight: '100vh' }}>
      <Toaster position="top-right" />
      
      {/* Main Title */} 
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 4 }}>
        Cash Conversion Cycle Strategies
      </Typography>

      {/* Grid layout for Info and Actions cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Informational Card - Simplified */} 
        <Grid item xs={12} md={7}>
          <Paper elevation={1} sx={{ padding: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'grey.300', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Title Removed */}
            {/* <Typography variant="h6" sx={{ mb: 2 }}>Cash Conversion Cycle (CCC)</Typography> */}
            {/* Image - Centered */} 
            <Box component="img" src={CashConversionCycleImage} alt="CCC Diagram" sx={{ maxWidth: '95%', maxHeight: '95%', height: 'auto', display: 'block', borderRadius: 1 }} />
          </Paper>
        </Grid>

        {/* Actions Card (Modified to match BusinessQuadrant) */} 
        <Grid item xs={12} md={5}>
          <Paper
            elevation={1} 
            sx={{
              padding: 2.5, 
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: 'white',
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'grey.300',
            }}
          >
             {/* Simple Title */} 
             <Typography variant="h6" sx={{ mb: 1.5 }}>
               Actions
             </Typography>
             {/* Mode Indicator Removed */} 

             {/* Wrapper Box to center button vertically */} 
             <Box sx={{ 
                 flexGrow: 1, // Take remaining vertical space
                 display: 'flex', 
                 alignItems: 'center', // Center vertically in this box
                 justifyContent: 'center', // Center horizontally
                 width: '100%'
             }}>
               {/* Button Box (already contains logic) */} 
               <Box sx={{ width: '100%' }}> {/* Ensure inner box allows fullWidth */} 
                   {isEditing ? (
                       <Button 
                           variant="contained" 
                           color="primary" 
                           size="medium" 
                           onClick={handleSave} 
                           disabled={isSaving || !isDirty} 
                           startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
                           fullWidth // Make button full width
                       > 
                           {isSaving ? 'Saving...' : 'Save Changes'} 
                       </Button>
                   ) : (
                       <Button
                           variant="contained"
                           size="medium"
                           onClick={() => setIsEditing(true)}
                           disabled={loading || !!error || isLoadingCompany}
                           fullWidth // Make button full width
                       >
                           Edit Strategies
                       </Button>
                   )}
               </Box>
             </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Table Area - Wrapped in Paper for distinct background/elevation */} 
      <Paper 
        elevation={2} 
        sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            border: isEditing ? '2px solid' : '1px solid',
            borderColor: isEditing ? 'primary.main' : 'grey.300',
            transition: 'border-color 0.3s',
            backgroundColor: 'white',
            mb: 4, // Add margin bottom to create space between this and the CashConversionMap
        }}
      >
        <TableContainer 
          component={Box} // Use Box instead of Paper for the container itself
          // elevation={isEditing ? 3 : 1} - Handled by outer Paper
          sx={{ 
            // border: isEditing ? 2 : 1, 
            // borderColor: isEditing ? 'primary.main' : 'grey.300', 
            // transition: 'border-color 0.3s, box-shadow 0.3s', 
          }}
        >
          {/* The actual Table component */}
          <Table sx={{ minWidth: 650 }} aria-label="cash acceleration strategies table" size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                {/* Empty cell for section letter column */}
                <TableCell sx={{ width: '5%', borderRight: 1, borderColor: 'divider', backgroundColor: 'grey.200', "&:hover": { backgroundColor: 'grey.200' }, paddingY: 0.1, verticalAlign: 'middle', textAlign: 'center' }} />
                {/* Description column header */}
                <TableCell sx={{ width: '71%', borderRight: 1, borderColor: 'divider', backgroundColor: 'grey.200', "&:hover": { backgroundColor: 'grey.200' }, paddingY: 0.1, fontSize: '0.9rem', verticalAlign: 'middle', textAlign: 'center' }}>Strategy Description</TableCell>
                {/* Headers for the checkbox columns - Reduced width */}
                <TableCell align="center" sx={{ width: '8%', fontWeight: 'bold', fontSize: '0.85rem', borderLeft: 1, borderColor: 'divider', verticalAlign: 'middle', textAlign: 'center', paddingX: 0.25, paddingY: 0.1, backgroundColor: 'grey.200', "&:hover": { backgroundColor: 'grey.200' } }}>Shorten Cycle Times</TableCell>
                <TableCell align="center" sx={{ width: '8%', fontWeight: 'bold', fontSize: '0.85rem', borderLeft: 1, borderColor: 'divider', verticalAlign: 'middle', textAlign: 'center', paddingX: 0.25, paddingY: 0.1, backgroundColor: 'grey.200', "&:hover": { backgroundColor: 'grey.200' } }}>Eliminate Mistakes</TableCell>
                <TableCell align="center" sx={{ width: '8%', fontWeight: 'bold', fontSize: '0.85rem', borderLeft: 1, borderColor: 'divider', verticalAlign: 'middle', textAlign: 'center', paddingX: 0.25, paddingY: 0.1, backgroundColor: 'grey.200', "&:hover": { backgroundColor: 'grey.200' } }}>Improve Business Model & P/L</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Render directly from strategies state */} 
              {strategies && sectionKeys.map((sectionKey) => (
                <React.Fragment key={sectionKey}>
                  {/* Section Header Row */} 
                  <TableRow sx={{ backgroundColor: '#606060', '& > *': { color: 'white !important', fontWeight: 'bold', borderBottom: 'none', paddingY: 0.5 }, "&:hover": { backgroundColor: '#606060' } }}>
                    <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.500', paddingY: 0.5 }}>
                      {sectionDetails[sectionKey].letter}
                    </TableCell>
                    <TableCell colSpan={4} sx={{ paddingY: 0.5 }}>
                      {sectionDetails[sectionKey].title}
                    </TableCell>
                  </TableRow>
                  {/* Strategy Rows */} 
                  {strategies[sectionKey].map((strategy: StrategyItem, strategyIndex: number) => (
                    <TableRow
                      key={`${sectionKey}-${strategyIndex}`} // Use index for key as items can be added/removed
                      sx={{ '& td, & th': { borderRight: 1, borderColor: 'divider', paddingY: 0.25 }, '&:last-child td, &:last-child th': { borderBottom: 0 } }}
                    >
                      <TableCell align="center" component="th" scope="row" sx={{ paddingY: 0.25, width: '5%' }}>
                        {strategyIndex + 1} {/* Display 1-based index */}
                        {/* Remove Button - Visible only in Edit Mode */} 
                        {isEditing && (
                           <IconButton
                              size="small"
                              onClick={() => handleRemoveStrategy(sectionKey, strategyIndex)}
                              title="Remove strategy"
                              sx={{ padding: 0.1, marginLeft: 0.5, color: 'error.main' }}
                           >
                             <DeleteOutlineIcon fontSize="inherit" />
                           </IconButton>
                        )}
                      </TableCell>
                      <TableCell sx={{ padding: 0.25, width: '71%' }}>
                         <TextField
                           fullWidth
                           variant="outlined"
                           size="small"
                           value={strategy.strategy} // Use field from StrategyItem
                           inputRef={el => { // Store input ref
                               if (!inputRefs.current[sectionKey]) inputRefs.current[sectionKey] = {};
                               inputRefs.current[sectionKey][strategyIndex] = el;
                           }}
                           onChange={(e) => handleDescriptionChange(sectionKey, strategyIndex, e.target.value)}
                           onKeyDown={(e) => { // Handle Enter key
                              if (e.key === 'Enter' && isEditing) {
                                  e.preventDefault();
                                  handleAddStrategy(sectionKey);
                              }
                           }}
                           placeholder="Enter strategy description..."
                           disabled={!isEditing}
                           InputProps={{
                             sx: { fontSize: '0.8rem' } 
                           }}
                         />
                       </TableCell>
                       {/* Checkbox Cells */} 
                      <TableCell align="center" sx={{ padding: 0, width: '8%' }}>
                         <Checkbox
                           checked={strategy.shorten_cycle_times} // Use field from StrategyItem
                           onChange={() => handleCheckboxChange(sectionKey, strategyIndex, 'shorten_cycle_times')}
                           inputProps={{ 'aria-label': `Shorten Cycle Times for ${sectionDetails[sectionKey].title} strategy ${strategyIndex + 1}` }}
                           disabled={!isEditing}
                           sx={{ padding: 0.25 }}
                         />
                       </TableCell>
                      <TableCell align="center" sx={{ padding: 0, width: '8%' }}>
                         <Checkbox
                           checked={strategy.eliminate_mistakes} // Use field from StrategyItem
                           onChange={() => handleCheckboxChange(sectionKey, strategyIndex, 'eliminate_mistakes')}
                           inputProps={{ 'aria-label': `Eliminate Mistakes for ${sectionDetails[sectionKey].title} strategy ${strategyIndex + 1}` }}
                           disabled={!isEditing}
                           sx={{ padding: 0.25 }}
                         />
                       </TableCell>
                      <TableCell align="center" sx={{ padding: 0, width: '8%' }}>
                         <Checkbox
                           checked={strategy.improve_business_model_pnl} // Use field from StrategyItem
                           onChange={() => handleCheckboxChange(sectionKey, strategyIndex, 'improve_business_model_pnl')}
                           inputProps={{ 'aria-label': `Improve Business Model & P/L for ${sectionDetails[sectionKey].title} strategy ${strategyIndex + 1}` }}
                           disabled={!isEditing}
                           sx={{ padding: 0.25 }}
                         />
                       </TableCell>
                    </TableRow>
                  ))}
                  {/* Add Strategy Button Row - Visible only in Edit Mode */} 
                  {isEditing && (
                      <TableRow>
                          <TableCell colSpan={5} align="left" sx={{ borderTop: 1, borderColor: 'divider', padding: 0.5 }}>
                              <Button
                                  size="small"
                                  startIcon={<AddCircleOutlineIcon />}
                                  onClick={() => handleAddStrategy(sectionKey)}
                                  disabled={isSaving}
                              >
                                  Add Strategy
                              </Button>
                          </TableCell>
                      </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add CashConversionMap component here, after the strategy table */}
      {companyId && <CashConversionMap companyId={companyId} />}
    </Box>
  );
};

export default CashAccelerationStrategies;
