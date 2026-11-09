"use client";

import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
import { useTranslation } from "@/i18n/useTranslation";

function PriceTable({ title, rows }) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Table size="small" sx={{ "& .MuiTableCell-root": { px: { xs: 1, sm: 2 } } }}>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={2}
              sx={{
                bgcolor: "grey.500",
                color: "common.white",
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                fontSize: "0.875rem",
                py: 1.25,
              }}
            >
              {title}
            </TableCell>
          </TableRow>
          {rows.map((row, index) => (
            <TableRow
              key={index}
              sx={{
                "&:last-child td": { borderBottom: 0 },
                "&:hover .hoverable-cell": { bgcolor: "#e3f2fd" },
              }}
            >
              <TableCell className="hoverable-cell" sx={{ width: { xs: "70%", sm: "80%" } }}>
                {row.label}
              </TableCell>
              <TableCell className="hoverable-cell" sx={{ whiteSpace: "nowrap" }}>
                {row.price}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function PriceList() {
  const { t } = useTranslation();

  const tableKeys = ["school", "sport", "vaccination", "certificates", "administrative", "other"];
  const tables = tableKeys.map((key) => ({
    key,
    title: t(`priceList.tables.${key}.title`),
    rows: t(`priceList.tables.${key}.rows`),
  }));

  return (
    <Box>
      <Box sx={{ p: 2, mb: 2, bgcolor: "rgba(255, 255, 255, 0.65)", borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          {t("priceList.title")}
        </Typography>
        <Typography variant="body1" align="center" sx={{ fontWeight: 500, mb: 2 }}>
          {t("priceList.eetNotice")}
        </Typography>
        <Typography variant="body1" align="center" sx={{ fontWeight: 500 }}>
          {t("priceList.validFrom")}
        </Typography>
      </Box>
      <Grid container spacing={3} rowSpacing={1.5} sx={{ mt: 1 }}>
        {tables.map((table) => (
          <Grid key={table.key} size={{ xs: 12 }}>
            <PriceTable title={table.title} rows={table.rows} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
