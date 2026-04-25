const GENERIC_REPAIR_LABELS = new Set(["repair", "custom repair", "repair service", "service"]);
const GENERIC_OTHER_LABELS = new Set(["others", "other repair"]);

const normalizeText = (value = "") => String(value ?? "").trim();

export const getPrimaryRepairOptionName = (source = {}, fallback = "Repair") => {
  const selectedOptions = Array.isArray(source?.selectedOptions) ? source.selectedOptions : [];
  const firstOptionName = normalizeText(selectedOptions[0]?.name);
  const repairDescription = normalizeText(source?.repairDescription);
  const service = normalizeText(source?.service);

  if (firstOptionName) {
    if (GENERIC_OTHER_LABELS.has(firstOptionName.toLowerCase()) && repairDescription) {
      return repairDescription;
    }

    return firstOptionName;
  }

  if (service && !GENERIC_REPAIR_LABELS.has(service.toLowerCase())) {
    return service;
  }

  if (repairDescription) {
    return repairDescription;
  }

  if (service) {
    return service;
  }

  return fallback;
};
