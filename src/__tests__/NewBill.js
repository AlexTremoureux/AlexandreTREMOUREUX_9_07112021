import { fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import firestore from "../app/Firestore.js"
import firebase from "../__mocks__/firebase.js"
import BillsUI from "../views/BillsUI.js"
import { ROUTES } from "../constants/routes.js"

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
      document.body.innerHTML = NewBillUI();
      expect(screen.getByTestId("new-bill").textContent).toEqual(
        " Envoyer une note de frais "
      );
    });
    // Test de la fonction handleChangeFile
    describe("And I upload an image file", () => {
      test("Then the file is good format", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;
        const firestore = { storage: { ref: jest.fn(() => {
              return {
                put: jest
                  .fn()
                  .mockResolvedValueOnce({ ref: { getDownloadURL: jest.fn() } }),
              };
            }),
          },
        };
        const newBill = new NewBill({ document, onNavigate, firestore, localStorage: window.localStorage })
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        const inputFile = screen.getByTestId("file")
        inputFile.addEventListener("change", handleChangeFile)
        fireEvent.change(inputFile, {
            target: {
                files: [new File(["image.jpg"], "image.jpg", { type: "image/jpg" })],
            }
        })
        expect(handleChangeFile).toBeCalled()
        expect(inputFile.files[0].name).toBe("image.jpg")
        expect(document.querySelector(".error-imageFormat").style.display).toBe("none")
      });
    });
    describe("And I upload a non-image file", () => {
      test("Then the error message should be display", async () => {
        document.body.innerHTML = NewBillUI()
        const newBill = new NewBill({ document, onNavigate, firestore: firestore, localStorage: window.localStorage })
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        const inputFile = screen.getByTestId("file")
        inputFile.addEventListener("change", handleChangeFile)
        fireEvent.change(inputFile, {
            target: {
                files: [new File(["fichier.txt"], "fichier.txt", { type: "text/txt" })],
            }
        })
        expect(handleChangeFile).toBeCalled()
        expect(inputFile.files[0].name).toBe("fichier.txt")
        expect(document.querySelector(".error-imageFormat").style.display).toBe("block")
      })
    })
    describe("And I submit a valid bill", () => {
      // Test de la fonction handleSubmit
      test("Then a bill is created", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore: firestore,
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
      });
    });
  })
})

// test d'intégration POST
