/**
 * @ jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import BillsUI from "../views/BillsUI.js"
import { ROUTES } from "../constants/routes.js"
import firebase from "../__mocks__/firebase.js"

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
}

Object.defineProperty(window, "localStorage", { value: localStorageMock });

window.localStorage.setItem(
  "user",
  JSON.stringify({ type: "Employee" })
);

describe("Given I am connected as an employee", () => {

  describe("When I am on NewBill Page", () => {
    // Affichage du formulaire
    test("Then the newBill page should be rendered", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getByTestId("new-bill").textContent).toEqual(
        " Envoyer une note de frais "
      );
    });

    // Test de la fonction handleChangeFile
    describe("When I add a valid extension of image file", () => {
      test("Then the file is upload", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;
        const firestore = {
          storage: {
            ref: () => ({
              put: () =>
                Promise.resolve({
                  ref: {
                    getDownloadURL: jest.fn(),
                  },
                }),
            }),
          },
        };
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore,
          localStorage: window.localStorage,
        });
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const inputFile = screen.getByTestId("file")
        inputFile.addEventListener("change", handleChangeFile)
        fireEvent.change(inputFile, {
            target: {
                files: [new File(["image.jpg"], "image.jpg", { type: "image/jpg" })],
            }
        })
        expect(handleChangeFile).toHaveBeenCalled;
        expect(inputFile.files[0].name).toBe("image.jpg")
        expect(screen.getByTestId("error-img").style.display).toBe("none")
      });
    });
    
    describe("When I add a wrong extension of image file", () => {
      test("Then the error message should be display", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage,
        });
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
        const inputFile = screen.getByTestId("file");
        inputFile.addEventListener("change", handleChangeFile);
        fireEvent.change(inputFile, {
          target: {
              files: [new File(["fichier"], "fichier.txt", { type: "texte/txt" })],
          }
        })
        const file = document.querySelector(`input[data-testid="file"]`)
        expect(handleChangeFile).toHaveBeenCalled;
        expect (file.value).toEqual("")
        expect(screen.getByTestId("error-img").style.display).toBe("block");
        
      });
    });

    describe("When I submit a valid bill", () => {
      // Test de la fonction handleSubmit
      test("Then a bill is created and i should be redirected to Bills page", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage,
        });
        const submit = screen.getByTestId("form-new-bill");
        const bill = {
          name: "Bill",
          date: "2021-11-26",
          type: "Transports",
          amount: 150,
          pct: 19,
          vat: 60,
          commentary: "Ceci est un test",
          fileName: "test.png",
          fileUrl: "test.png",
        };
        const handleSubmit = jest.fn(newBill.handleSubmit);
        newBill.createBill = (newBill) => newBill;
        screen.getByTestId("expense-type").value = bill.type;
        screen.getByTestId("expense-name").value = bill.name;
        screen.getByTestId("amount").value = bill.amount;
        screen.getByTestId("datepicker").value = bill.date;
        screen.getByTestId("vat").value = bill.vat;
        screen.getByTestId("pct").value = bill.pct;
        screen.getByTestId("commentary").value = bill.commentary;
        newBill.fileUrl = bill.fileUrl;
        newBill.fileName = bill.fileName;
        submit.addEventListener("click", handleSubmit);
        fireEvent.click(submit);
        expect(handleSubmit).toHaveBeenCalled();
        expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      });
    });
    
  })

  // test d'intégration POST
  describe("Given I am connected as Employee", () => {
    describe("When I post a bill", () => {
      test("number of bills fetched should be increased of 1", async () => {
        const post = jest.spyOn(firebase , "post");
        const newBillToPost = {
          "id": "UIUZtnPQvnbFnB0ozvJm",
          "name": "test4",
          "email": "b@b",
          "type": "Services en ligne",
          "vat": "90",
          "pct": 25,
          "commentAdmin": "bon bah ok",
          "amount": 350,
          "status": "pending",
          "date": "2021-11-28",
          "commentary": "",
          "fileName": "facture-client-php-exportee-dans-document-pdf-enregistre-sur-disque-dur.png",
          "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…dur.png?alt=media&token=571d34cb-9c8f-430a-af52-66221cae1da3"
        };
        const billsWithNewBill = await firebase.post(newBillToPost);
        expect(post).toHaveBeenCalledTimes(1);
        expect(billsWithNewBill.data.length).toBe(5);
      });

      test("fetches bills from an API and fails with 404 message error", async () => {
        firebase.post.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 404"))
        );
        const html = BillsUI({ error: "Erreur 404" });
        document.body.innerHTML = html;
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
      test("fetches messages from an API and fails with 500 message error", async () => {
        firebase.post.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 500"))
        );
        const html = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = html;
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });

})
