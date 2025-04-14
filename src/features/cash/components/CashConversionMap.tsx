import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Stack,
  CircularProgress,
  Button,
} from '@mui/material';
import useCashConversionMap from '../services/useCashConversionMap';
import { CashConversionMap as CashConversionMapType } from '../types/cashConversion';

interface CashConversionMapProps {
  companyId: string;
}

const CashConversionMap: React.FC<CashConversionMapProps> = ({ companyId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [localMap, setLocalMap] = useState<CashConversionMapType | null>(null);
  
  const { 
    data: cashConversionMap, 
    loading, 
    error, 
    updateCashConversionMap 
  } = useCashConversionMap(companyId);

  // Initialize local map when data is loaded
  React.useEffect(() => {
    if (cashConversionMap) {
      setLocalMap(cashConversionMap);
    }
  }, [cashConversionMap]);

  const handleChange = (
    type: 'actual_ccc' | 'desired_ccc' | 'estimated_ccc',
    stage: 'A' | 'B' | 'C' | 'D',
    value: number
  ) => {
    if (!localMap || !isEditing) return;

    const updatedMap: CashConversionMapType = {
      metric_sets: {
        ...localMap.metric_sets,
        [type]: {
          ...localMap.metric_sets[type],
          stages: {
            ...localMap.metric_sets[type].stages,
            [stage]: {
              unit: 'days',
              value
            }
          }
        }
      }
    };

    setLocalMap(updatedMap);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!localMap) return;
    
    setIsSaving(true);
    try {
      const result = await updateCashConversionMap({
        cash_conversion_map: localMap
      });

      if (result.success) {
        setIsEditing(false);
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    // Reset local map to current server data when starting to edit
    if (cashConversionMap) {
      setLocalMap(cashConversionMap);
    }
    setIsDirty(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, color: 'error.main' }}>
        <Typography>Error loading cash conversion map: {error}</Typography>
      </Box>
    );
  }

  if (!localMap) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No cash conversion map data available.</Typography>
      </Box>
    );
  }

  const renderRow = (
    type: 'actual_ccc' | 'desired_ccc' | 'estimated_ccc',
    label: string
  ) => {
    const metricSet = localMap.metric_sets[type];
    const sum = Object.values(metricSet.stages).reduce((acc, stage) => acc + stage.value, 0);

    return (
      <Stack 
        direction="row" 
        spacing={0} 
        alignItems="stretch" 
        sx={{ 
          mb: 3,
          '&:last-child': {
            mb: 0
          }
        }}
      >
        {/* Left Box */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: isEditing ? 'primary.main' : 'divider',
            width: '300px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '48px',
              borderBottom: 1,
              borderColor: isEditing ? 'primary.main' : 'divider',
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.primary',
                textAlign: 'center',
                py: 1,
                px: 2,
                fontWeight: 'bold',
                fontSize: '0.9rem',
              }}
            >
              {label}
            </Typography>
          </Box>
          <Box 
            sx={{ 
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              backgroundColor: 'white',
            }}
          >
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'medium',
                color: 'text.primary',
              }}
            >
              {sum}
            </Typography>
          </Box>
        </Box>

        {/* Dots Separator */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            fontSize: '20px',
            letterSpacing: '2px',
            color: 'text.secondary'
          }}
        >
          •••••••
        </Box>

        {/* Right Boxes */}
        <Stack direction="row" spacing={0} sx={{ flexGrow: 1 }}>
          {(['A', 'B', 'C', 'D'] as const).map((stage, index) => (
            <Box
              key={stage}
              sx={{
                border: '1px solid',
                borderColor: isEditing ? 'primary.main' : 'divider',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                borderLeft: index === 0 ? '1px solid' : 'none',
                borderLeftColor: isEditing ? 'primary.main' : 'divider',
              }}
            >
              <Box
                sx={{
                  backgroundColor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '48px',
                  borderBottom: 1,
                  borderColor: isEditing ? 'primary.main' : 'divider',
                }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'text.primary',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}
                >
                  {stage}
                </Typography>
              </Box>
              <Box 
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                  backgroundColor: 'white',
                }}
              >
                <Box 
                  component="input"
                  type="number"
                  value={metricSet.stages[stage].value}
                  onChange={(e) => handleChange(type, stage, parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                  sx={{
                    border: 'none',
                    width: '100%',
                    textAlign: 'center',
                    fontSize: '1.25rem',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: 'text.primary',
                    cursor: isEditing ? 'text' : 'default',
                    '&:disabled': {
                      color: 'text.primary',
                      WebkitTextFillColor: 'initial',
                      opacity: 1,
                    },
                    '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
                      '-webkit-appearance': 'none',
                      margin: 0
                    }
                  }}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      </Stack>
    );
  };

  return (
    <Paper 
      elevation={2}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: isEditing ? 'primary.main' : 'grey.300',
        backgroundColor: 'white',
      }}
    >
      <Box
        sx={{ 
          backgroundColor: 'grey.200',
          borderBottom: 1,
          borderColor: isEditing ? 'primary.main' : 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1,
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold',
            color: 'text.primary',
            fontSize: '0.9rem',
          }}
        >
          Cash Conversion Map
        </Typography>
        {isEditing ? (
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            sx={{ minWidth: 100 }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        ) : (
          <Button
            variant="contained"
            size="small"
            onClick={handleStartEditing}
            sx={{ minWidth: 100 }}
          >
            Edit
          </Button>
        )}
      </Box>

      <Box sx={{ p: 3 }}>
        {renderRow('estimated_ccc', 'Estimated CCC No. Of Days (currently)')}
        {renderRow('actual_ccc', 'Actual CCC No. Of Days (currently)')}
        {renderRow('desired_ccc', 'Desired CCC No. Of Days')}
      </Box>
    </Paper>
  );
};

export default CashConversionMap;
