const FACEBOOK_URL =
  "https://www.facebook.com/MUDR-Anton%C3%ADn-Gabera-d%C4%9Btsk%C3%BD-l%C3%A9ka%C5%99-578751426140864";

// Built-in contacts shown until they are edited and saved.
function defaultPractices(t) {
  return [
    {
      doctors: [t("contact.name"), t("contact.nameExtra")],
      phone: t("contact.phone"),
      email: t("contact.email"),
      dataBox: t("contact.databox"),
      facebook: FACEBOOK_URL,
    },
    {
      doctors: [t("contact.name"), t("contact.name2")],
      phone: t("contact.phone2"),
      email: t("contact.email2"),
      dataBox: t("contact.databox2"),
      facebook: "",
    },
  ];
}

// Always returns two practices; saved contacts replace the defaults entirely, including deleted doctors.
export function resolveContacts(stored, t) {
  return stored?.practices?.length === 2 ? stored.practices : defaultPractices(t);
}

// Shape sent to the API: doctors without a name are dropped.
export function toPayload(practices) {
  return {
    practices: practices.map(({ doctors, phone, email, dataBox, facebook }) => ({
      doctors: doctors.map((doctor) => doctor.text.trim()).filter(Boolean),
      phone: phone.trim(),
      email: email.trim(),
      dataBox: dataBox.trim(),
      facebook: facebook.trim(),
    })),
  };
}
