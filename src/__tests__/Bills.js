/**
 * @ jest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import { ROUTES } from "../constants/routes.js";
import firebase from "../__mocks__/firebase.js";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};
//On indique que l'utilisateur est un Employee
Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

describe("Given I am connected as an employee", () => {
  // composant views/Bills : faire passer le taux de couverture à 100%
  describe("When I am on Bill page but it is loading", () => {
    test("Then, Loading page should be rendered", () => {
      const html = BillsUI({ loading: true });
      document.body.innerHTML = html;
      expect(screen.getAllByText("Loading...")).toBeTruthy();
    });
  });
  describe("When I am on Bill page but error message", () => {
    test("Then, Error page should be rendered", () => {
      const html = BillsUI({ error: "error" });
      document.body.innerHTML = html;
      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  });
  describe("When I am on Bills Page", () => {
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- \/\.](0[1-9]|1[012])[- \/\.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  // composant container/Bills :
  describe("When I click on the new bill button", () => {
    test("Then the click function handleClickNewBill should be called", () => {
      // affichage de la page Bill en récupérant les data liés aux notes de frais
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const newBill = new Bills({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });
      const handleClickNewBill = jest.fn(newBill.handleClickNewBill);
      const btnNewBill = screen.getByTestId("btn-new-bill");
      btnNewBill.addEventListener("click", handleClickNewBill);
      userEvent.click(btnNewBill);
      expect(handleClickNewBill).toBeCalled();
    });
  });
  describe("When I click on the eye icon", () => {
    test("Then a modal should be open", () => {
      // On simule la création d'une modale (dans BillsUI)
      $.fn.modal = jest.fn();
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const bill = new Bills({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });
      const handleClickIconEye = jest.fn(bill.handleClickIconEye);
      const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
      iconEye.forEach((icon) => {
        icon.addEventListener("click", handleClickIconEye(icon));
        userEvent.click(icon);
        expect(handleClickIconEye).toBeCalled();
        const modale = screen.getByTestId("modaleFileEmployee");
        expect(modale).toBeTruthy();
      });
    });
  });

  // test d'intégration GET Bills
  describe("Given I am connected as Employee", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get");
      const bills = await firebase.get();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
