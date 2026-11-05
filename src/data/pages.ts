/**
 * Council pages, with the public text and outbound links copied from the live
 * uwomeds.com pages on 2026-11-05. Links the 2026-10-25 site audit found dead
 * (old schulichmeds.com hosts, md.cma.ca, 404s, certificate errors) are left out,
 * and so are personal names, emails and phone numbers.
 * In the real site these are `content_items` rows (collection = 'page') that page
 * editors change on the site (plan Tasks 15-16).
 */
export interface CouncilPage {
  slug: string;
  title: string;
  body: string; // Markdown
}

export const COUNCIL_PAGES: CouncilPage[] = [
  {
    slug: 'wellness',
    title: 'Wellness Resource Hub',
    body: `Here you will find several wellness resources that may be helpful to you.

- [London Guide](https://docs.google.com/spreadsheets/d/1IMiPelBuFtIilLVDU6l5iNcH5C8PCOtZ3ur88Ox8Ga0/edit?usp=sharing)
- [Windsor Guide](https://docs.google.com/spreadsheets/d/1NWXiMbLe5aLpVf8ytSyT-y43cEIdC7pOcxrmwAZACh8/edit?usp=sharing)
- [Wellness Activities](https://drive.google.com/drive/folders/1iuLZsrd13DtN4BuKRky_BSFx_aJZ1bpD?usp=share_link)
- [Learner Mistreatment](https://www.schulich.uwo.ca/learner_experience/learner_mistreatment/index.html)
- [Reporting Tool](https://forms.office.com/Pages/ResponsePage.aspx?id=TaaTrQ2tzU6y_eU84VllvkyIO7UKPu5Jjj0wIvwgSHBUQUExQUtYMFRWVUpPV0s1NEM2MDFIMUpBNiQlQCN0PWcu)

## Other Useful Wellness Resources
- [Learner Equity & Wellness](https://www.schulich.uwo.ca/learner-equity-wellness/)
- [Student Support Team](https://www.schulich.uwo.ca/learner-equity-wellness/services/student_support_team.html)
- [Financial Aid](http://www.registrar.uwo.ca/student_finances/osap_government_loans/ontario_student_assistance_program_osap.html)`,
  },
  {
    slug: 'academic',
    title: 'Academic Resources',
    body: `Here you will find several academic resources that may be helpful to you including current research opportunities available with who to contact.

## Current Research Opportunities
- [Open Spreadsheet in Fullscreen](https://docs.google.com/spreadsheets/d/e/2PACX-1vQCOzcYMyVEhsZ2bNtlQT0zX3MgVCG6ZsiBrwyRTqP1qwQamrOuZVfSV_gEozj9ce7zdhsADM-g0hlh/pubhtml)
- [Submit Request for Research Participants](https://docs.google.com/forms/d/e/1FAIpQLSdtRgwXrbZDwNK_QPFZOeVrvAlPAYQY4XnXJQJejtH9T3zvGg/viewform)

## Academic Notes
- [Pre-Clerkship](https://drive.google.com/drive/folders/1Dn4awPOxOo0gqo8yoCTwYPSEZkyJxXqh?usp=sharing)
- [Clerkship](https://drive.google.com/drive/folders/1CCdpY_8GZrO0QF6XAr5WA3Adqa4gpTGY?usp=sharing)
- [Residency](https://drive.google.com/drive/folders/13E1zScVts7lhpUB6UjgY5rWfeCIbUp8t?usp=sharing)

## Other Resources
- [HippoNotes & HippoAnki](https://docs.google.com/document/d/1fPbZvkijiz9a1nGpDmGzXJSk25j9FwbSuJVr3egA9rk/edit)
- [MEDCRAM Videos](https://www.youtube.com/user/MEDCRAMvideos/videos)
- [Research From Home](/research-from-home/)`,
  },
  {
    slug: 'extracurricular',
    title: 'Extracurricular Resources',
    body: `Here you will find several extracurricular resources that may be helpful to you.

- [Club Proposal Form](https://docs.google.com/document/d/1afPtufA-jsAVtFlHQ5W-2fn_CpFfbgXQ/edit?usp=sharing&ouid=102127322637693441676&rtpof=true&sd=true)
- [Hippocratic Council Club Policy](https://docs.google.com/document/d/1DT_-EsK1ytPKZ9vrDma4hKFkA_KqwtqS/edit?usp=sharing&ouid=102127322637693441676&rtpof=true&sd=true)
- [International Opportunities](http://www.schulich.uwo.ca/medicine/undergraduate/academic_resources/international__health_equity_learning/international_opportunities1/index.html)
- [Observerships & Electives](http://www.schulich.uwo.ca/medicine/undergraduate/academic_resources/preclerkship/index.html)
- [USC Western](http://westernusc.ca/)`,
  },
  {
    slug: 'educational',
    title: 'Educational Resources',
    body: `Here you will find several educational resources that may be helpful to you.

## Schulich Curriculum
- [Click to view PDF](https://uwomeds.com/wp-content/uploads/2023/04/EDID-Curriculum-Report-2020-2021.pdf)

## Supplementary Resources
- [Wiki Journal Club](http://wikijournalclub.org/wiki/Main_Page)
- [Isabel Symptom Checker](http://symptomchecker.isabelhealthcare.com/)
- [Canadian Specialty Profiles](https://www.cma.ca/En/Pages/specialty-profiles.aspx)
- [CPR Seminar Series](http://www.schulich.uwo.ca/gradstudies/current_students/Researchers%20Seminar%20Series/index.html)`,
  },
  {
    slug: 'research-from-home',
    title: 'Research From Home',
    body: `The following will redirect you through the Western University web proxy so that you can easily do research from home. If you would like to use a research website that Western provides access to, but is not listed below, you can use Western's [EZProxy Link Generator](https://www.lib.uwo.ca/offcampus/ezform.html) to work from home. To make the process more convenient, you can follow [the instructions here](https://www.lib.uwo.ca/offcampus/remote.html#button) to add a bookmark that will automatically redirect the research website with a single click.

- [DynaMed](http://search.ebscohost.com.proxy1.lib.uwo.ca/login.aspx?authtype=ip,uid&profile=dynamed&custid=s5336682)
- [CPA RxTx](http://www.e-therapeutics.ca.proxy1.lib.uwo.ca/)
- [Cochrane Library](http://www.cochranelibrary.com.proxy1.lib.uwo.ca/)
- [Access Medicine](http://accessmedicine.mhmedical.com.proxy1.lib.uwo.ca/)
- [PubMed](http://www-ncbi-nlm-nih-gov.proxy1.lib.uwo.ca/pubmed?otool=icauwomlib)
- [Essential Evidence Plus](http://www.essentialevidenceplus.com.proxy1.lib.uwo.ca/)`,
  },
  {
    slug: 'meetings-and-updates',
    title: 'Meetings and Updates',
    body: `## Independent Student Analysis Summary
We are pleased to present a summary of the Independent Student Analysis (ISA). The ISA was completed to obtain student feedback regarding education, resources, services and overall student experience as a component of the Interim Accreditation Review for the Schulich School of Medicine & Dentistry (SSMD). Your feedback is incredibly appreciated and is a crucial part of student-led change within SSMD. This data is being used to direct change across SSMD.

## Meeting Minutes
Please find the Meeting Minutes for the Monthly Hippocratic Council Meetings [here](https://drive.google.com/drive/folders/1SxSPk4rSam6_Q0_MVkXO3aSbC9nptpvc?usp=sharing).`,
  },
  {
    slug: 'sponsors',
    title: 'Sponsors',
    body: `The Hippocratic Council fosters student growth by supporting and directly funding student initiatives here at Schulich. As the governing body of the medical students, we are responsible for helping students get the most of their medical education through encouraging excellence outside of the classroom.

None of this would be possible without the support of valued sponsors. With their financial help, we can continue to develop and grow into valuable members of the healthcare community.

## Scotiabank
At Scotiabank we are committed to providing you with the best advice and customer service in the industry. We are able to assist you with financing your education, budgeting, financial planning, practice financing and wealth management.

## MD Financial Management
MD Financial Management is owned by the Canadian Medical Association, and our only mandate is the financial well-being of Canada's physicians, medical students and residents. With your CMA membership, you benefit from MD's objective, specialized advice, which is always in your best interests.

Our MD MedEd Counsel is a team of MD Advisors and Early Career Specialists dedicated to medical students and residents. Whether you need to pay for medical school, prepare for residency, start investing or manage your debt, you'll sleep better knowing you're on the right track.

## GiftAFeeling
GiftAFeeling is your one stop print shop specializing in research-based giveaways, promotional products & personalized gifts. We can place your logo, text, or design on almost anything from branded apparel like custom t shirts to mugs, to any product you can name. Visit us at [giftafeeling.com](https://www.giftafeeling.com/).

## Zavitz Insurance
For nearly 35 years, the team at Zavitz Insurance has been providing diverse and innovative solutions for medical professionals. We bring a holistic approach to financial management, combining retirement and estate planning, investment services and insurance, all on one page. We are well versed on the financial evolution of a medical student transitioning into resident, practicing physician and beyond. Visit [zavitzinsurance.com](http://www.zavitzinsurance.com).

## Abrams Financial
[Abrams Financial](http://www.abramsfinancial.ca/) is an independent financial brokerage dedicated to helping physicians achieve their financial goals through creative insurance, wealth management, and tax advisory solutions.`,
  },
];

/** The live Documents page (uwomeds.com/council-2/). */
export const DOCUMENTS = [
  {
    title: 'Hippocratic Council Constitution',
    url: 'https://uwomeds.com/wp-content/uploads/2022/08/Hippocratic-Council-Constitution.docx',
  },
  {
    title: 'Class Council - Terms of Reference',
    url: 'https://uwomeds.com/wp-content/uploads/2022/08/Class-Council-ToR.docx',
  },
];
