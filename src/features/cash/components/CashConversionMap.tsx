import React, { useState, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Stack,
} from '@mui/material';

interface CycleData {
  A: number;
  B: number;
  C: number;
  D: number;
}

interface CashConversionMapProps {
  onDataChange?: (type: string, data: CycleData) => void;
}

const CashConversionMap: React.FC<CashConversionMapProps> = ({ onDataChange }) => {
  const [estimatedCCC, setEstimatedCCC] = useState<CycleData>({ A: 0, B: 0, C: 0, D: 0 });
  const [actualCCC, setActualCCC] = useState<CycleData>({ A: 0, B: 0, C: 0, D: 0 });
  const [desiredCCC, setDesiredCCC] = useState<CycleData>({ A: 0, B: 0, C: 0, D: 0 });

  const sums = useMemo(() => ({
    estimated: Object.values(estimatedCCC).reduce((a, b) => a + b, 0),
    actual: Object.values(actualCCC).reduce((a, b) => a + b, 0),
    desired: Object.values(desiredCCC).reduce((a, b) => a + b, 0),
  }), [estimatedCCC, actualCCC, desiredCCC]);

  const handleChange = (
    type: 'estimated' | 'actual' | 'desired',
    stage: keyof CycleData,
    value: number
  ) => {
    const setter = {
      estimated: setEstimatedCCC,
      actual: setActualCCC,
      desired: setDesiredCCC,
    }[type];

    setter((prev) => {
      const newData = { ...prev, [stage]: value };
      onDataChange?.(type, newData);
      return newData;
    });
  };

  const renderRow = (
    type: 'estimated' | 'actual' | 'desired',
    data: CycleData,
    label: string
  ) => (
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
          borderColor: 'divider',
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
            borderColor: 'divider',
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
            {sums[type]}
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
              borderColor: 'divider',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: index === 0 ? '1px solid' : 'none',
              borderLeftColor: 'divider',
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
                borderColor: 'divider',
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
                value={data[stage] || ''}
                onChange={(e) => handleChange(type, stage, parseInt(e.target.value) || 0)}
                sx={{
                  border: 'none',
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  color: 'text.primary',
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

  return (
    <Paper 
      elevation={2}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'grey.300',
        backgroundColor: 'white',
      }}
    >
      <Box
        sx={{ 
          backgroundColor: 'grey.200',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            py: 1,
            px: 2,
            fontWeight: 'bold',
            color: 'text.primary',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}
        >
          Cash Conversion Map
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        {renderRow('estimated', estimatedCCC, 'Estimated CCC No. Of Days (currently)')}
        {renderRow('actual', actualCCC, 'Actual CCC No. Of Days (currently)')}
        {renderRow('desired', desiredCCC, 'Desired CCC No. Of Days')}
      </Box>
    </Paper>
  );
};

export default CashConversionMap;
