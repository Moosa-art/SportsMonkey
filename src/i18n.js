import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// i18next configuration
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          social: "Social",
          logo_442: "442",
          search: "Search",
          inbox: "Inbox",
          notifications: "Notifications",
          profile: "Profile",
          home: "Home",
          fixtures: "Fixtures",
          table: "Table",
          live: "Live",
          me: "Me",
          comments: "Comments",
          share: "Share",
          report: "Report",
          cancel: "Cancel",
          submit: "Submit",
          done: "Done",
          success: "Success",
          post_details: "Post Details"
        }
      }
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
