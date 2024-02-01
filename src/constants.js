const utmQueryParams = "utm_source=photoshop&utm_medium=plugin&utm_campaign=watermarkremoverio";

export const constants = {
    urls: {
        redirectToAppsPage: `https://console.pixelbin.io/choose-org?redirectTo=settings/apps&${utmQueryParams}`,
        redirectToDashboardPage: `https://console.pixelbin.io/choose-org?redirectTo=dashboard&${utmQueryParams}`,
        redirectToPricingPage: `https://console.pixelbin.io/choose-org?redirectTo=settings/billing/pricing&${utmQueryParams}`,

        orgPricingPage: `https://console.pixelbin.io/organization/:orgId/settings/billing/pricing?${utmQueryParams}`,

        pluginHomePage: `https://www.watermarkremover.io?${utmQueryParams}`,
        pluginDoc: `https://www.pixelbin.io/docs/integrations/photoshop/watermarkremover.io/?${utmQueryParams}`,

        apiDomain: "https://api.pixelbin.io",
    },
};
