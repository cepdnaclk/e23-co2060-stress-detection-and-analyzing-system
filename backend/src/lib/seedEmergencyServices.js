import EmergencyMentalHealthService from "../models/EmergencyMentalHealthService.js";

export const seedEmergencyServices = async () => {
  try {
    const count = await EmergencyMentalHealthService.countDocuments();
    if (count === 0) {
      console.log("Seeding Emergency Mental Health Services...");

      const services = [
        {
          serviceName: "National Mental Health Helpline \u2013 1926",
          contact: "1926",
          description:
            "Mental-health support, crisis support and suicide-prevention assistance. The service is available 24/7 and is toll-free.",
          displayOrder: 1,
        },
        {
          serviceName: "National Institute of Mental Health (NIMH)",
          contact: "011 257 8234\u20137",
          description:
            "Provides psychiatric and mental-health services, including emergency psychiatric assessment, treatment and referral/admission services. The NIMH OPD is available 24 hours. Located in Mulleriyawa New Town.",
          displayOrder: 2,
        },
        {
          serviceName: "Sri Lanka Sumithrayo",
          contact: "011 268 2535",
          description:
            "Provides emotional support and counselling services for people experiencing emotional distress or mental-health difficulties.",
          displayOrder: 3,
        },
        {
          serviceName: "CCCline \u2013 CCC Foundation",
          contact: "1333",
          description:
            "Provides counselling and emotional support services for people experiencing emotional distress or mental-health difficulties.",
          displayOrder: 4,
        },
        {
          serviceName: "National Child Protection Authority",
          contact: "1929",
          description:
            "Provides support, telephone counselling and assistance related to child abuse, maltreatment and child-protection concerns.",
          displayOrder: 5,
        },
        {
          serviceName: "Women Helpline",
          contact: "1938",
          description:
            "Provides support and assistance for women experiencing violence or other related crisis situations.",
          displayOrder: 6,
        },
      ];

      await EmergencyMentalHealthService.insertMany(services);
      console.log(`Successfully seeded ${services.length} emergency mental-health services.`);
    } else {
      console.log("Emergency Mental Health Services already seeded.");
    }
  } catch (error) {
    console.error("Error seeding Emergency Mental Health Services:", error);
  }
};
