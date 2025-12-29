import { Stack, Typography } from "@mui/material";

export type StatProps = {
  label: string;
  value: number | string;
};

export const Stat = ({ label, value }: StatProps) => {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <Stack
      direction="column"
      spacing={1}
      sx={{ textAlign: "center" }}
      alignItems="center"
    >
      <Typography variant="h3" fontWeight={700}>
        {displayValue}
      </Typography>
      <Typography variant="body2" color="text.secondary" fontSize={20}>
        {label}
      </Typography>
    </Stack>
  );
};
